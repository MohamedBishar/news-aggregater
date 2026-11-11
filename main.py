import os, sqlite3, hashlib, hmac, base64, json, time
from pathlib import Path
from typing import Optional
import httpx
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent
load_dotenv(BASE.parent / ".env")
DB_PATH = BASE.parent / "news.db"
API_KEY = os.getenv("GNEWS_API_KEY", "").strip()
TOKEN_SECRET = os.getenv("TOKEN_SECRET", "change-this-secret-before-deployment")

app = FastAPI(title="Pulse News Aggregator", version="1.0.0",
              description="A student news aggregator with categories, search, bookmarks and recommendations.")
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")

DEMO_ARTICLES = [
    {"title":"AI research is reshaping the way developers build software","description":"A look at how new AI tools are changing software workflows, and why human review still matters.","content":"A look at how new AI tools are changing software workflows, and why human review still matters.","url":"https://example.com/technology-ai","image":"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=900","source":"Demo Technology Desk","published_at":"2026-11-06T09:00:00Z","category":"technology"},
    {"title":"Universities expand practical engineering and research programmes","description":"Institutions are placing more emphasis on hands-on projects, labs and industry collaboration.","content":"Institutions are placing more emphasis on hands-on projects, labs and industry collaboration.","url":"https://example.com/education-engineering","image":"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900","source":"Campus Review","published_at":"2026-11-06T07:30:00Z","category":"education"},
    {"title":"Global markets watch inflation and central bank decisions","description":"Investors are assessing fresh economic indicators and their possible effect on interest rates.","content":"Investors are assessing fresh economic indicators and their possible effect on interest rates.","url":"https://example.com/business-markets","image":"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900","source":"Market Brief","published_at":"2026-11-05T14:00:00Z","category":"business"},
    {"title":"New conservation projects focus on protecting urban biodiversity","description":"Researchers and local groups are testing practical ways to support wildlife in growing cities.","content":"Researchers and local groups are testing practical ways to support wildlife in growing cities.","url":"https://example.com/science-conservation","image":"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900","source":"Science Weekly","published_at":"2026-11-05T11:00:00Z","category":"science"},
    {"title":"Teams prepare for a packed international sporting calendar","description":"Coaches are balancing player fitness, travel and tactical preparation ahead of major fixtures.","content":"Coaches are balancing player fitness, travel and tactical preparation ahead of major fixtures.","url":"https://example.com/sports-calendar","image":"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900","source":"Sports Desk","published_at":"2026-11-04T16:00:00Z","category":"sports"},
    {"title":"Cities test cleaner public transport options","description":"Electric buses and improved route planning are part of a wider push to reduce urban emissions.","content":"Electric buses and improved route planning are part of a wider push to reduce urban emissions.","url":"https://example.com/world-transport","image":"https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=900","source":"World Report","published_at":"2026-11-04T08:00:00Z","category":"world"},
]

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users(
          id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS saved_articles(
          user_id INTEGER NOT NULL, article_url TEXT NOT NULL, article_json TEXT NOT NULL,
          saved_at TEXT DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_id, article_url),
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS preferences(
          user_id INTEGER PRIMARY KEY, categories TEXT NOT NULL DEFAULT '[]',
          FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS article_cache(
          article_url TEXT PRIMARY KEY, article_json TEXT NOT NULL, cached_at INTEGER NOT NULL
        );
        """)

init_db()

def password_hash(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 180000).hex()

def make_token(user_id: int) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"uid":user_id,"exp":int(time.time())+86400*7}).encode()).decode().rstrip("=")
    sig = hmac.new(TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return payload + "." + sig

def current_user(authorization: Optional[str]) -> Optional[int]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        payload, sig = token.split(".", 1)
        expected = hmac.new(TOKEN_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected): return None
        data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload)%4)))
        if data["exp"] < time.time(): return None
        return int(data["uid"])
    except Exception:
        return None

def require_user(authorization: Optional[str]) -> int:
    uid = current_user(authorization)
    if not uid: raise HTTPException(401, "Please sign in to use this feature.")
    return uid

class AuthBody(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=100)

class SaveBody(BaseModel):
    article: dict

class PreferenceBody(BaseModel):
    categories: list[str]

def normalize_gnews(item: dict, category: str = "general") -> dict:
    src = item.get("source") or {}
    return {
        "title": item.get("title") or "Untitled article",
        "description": item.get("description") or "",
        "content": item.get("content") or item.get("description") or "",
        "url": item.get("url") or "",
        "image": item.get("image") or "",
        "source": src.get("name", "Unknown source") if isinstance(src, dict) else str(src),
        "published_at": item.get("publishedAt") or "",
        "category": category
    }

async def fetch_news(category="general", q=None, country="in"):
    if not API_KEY:
        items = DEMO_ARTICLES[:]
        if category not in ("general", "all"):
            items = [a for a in items if a["category"] == category]
        if q:
            needle = q.lower()
            items = [a for a in items if needle in (a["title"]+" "+a["description"]).lower()]
        return items, "demo"
    params = {"apikey":API_KEY, "lang":"en", "country":country, "max":10}
    endpoint = "top-headlines"
    if q:
        endpoint = "search"; params["q"] = q
    elif category not in ("general", "all"):
        params["category"] = category
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"https://gnews.io/api/v4/{endpoint}", params=params)
        if response.status_code == 403:
            raise HTTPException(502, "News API quota used or account not verified. Try later or use demo mode.")
        if response.status_code == 401:
            raise HTTPException(502, "News API key is invalid. Check GNEWS_API_KEY in .env.")
        response.raise_for_status()
        data = response.json()
    articles = [normalize_gnews(x, category) for x in data.get("articles", [])]
    return articles, "gnews"

@app.get("/")
def home():
    return FileResponse(BASE / "static" / "index.html")

@app.get("/api/health")
def health():
    return {"status":"ok", "news_provider":"GNews" if API_KEY else "demo data"}

@app.get("/api/news")
async def news(category: str = "general", q: Optional[str] = None, country: str = "in"):
    try:
        items, provider = await fetch_news(category, q, country)
        return {"articles":items, "provider":provider, "count":len(items)}
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Could not retrieve news: {str(e)}")

@app.post("/api/auth/register")
def register(body: AuthBody):
    email = body.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(400, "Enter a valid email address.")
    salt = base64.urlsafe_b64encode(os.urandom(16)).decode()
    hashed = password_hash(body.password, salt)
    try:
        with db() as c:
            cur = c.execute("INSERT INTO users(email,password_hash,salt) VALUES(?,?,?)",(email,hashed,salt))
            uid = cur.lastrowid
            c.execute("INSERT INTO preferences(user_id,categories) VALUES(?,?)",(uid,"[]"))
    except sqlite3.IntegrityError:
        raise HTTPException(409, "An account with this email already exists.")
    return {"token":make_token(uid), "email":email}

@app.post("/api/auth/login")
def login(body: AuthBody):
    with db() as c:
        row = c.execute("SELECT * FROM users WHERE email=?",(body.email.strip().lower(),)).fetchone()
    if not row or not hmac.compare_digest(password_hash(body.password,row["salt"]),row["password_hash"]):
        raise HTTPException(401, "Incorrect email or password.")
    return {"token":make_token(row["id"]), "email":row["email"]}

@app.get("/api/me")
def me(authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    with db() as c:
        row = c.execute("SELECT email FROM users WHERE id=?",(uid,)).fetchone()
    return {"email":row["email"]}

@app.post("/api/saved")
def save_article(body: SaveBody, authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    article = body.article
    url = article.get("url")
    if not url or not url.startswith(("http://","https://")):
        raise HTTPException(400, "Article has no valid original URL.")
    with db() as c:
        c.execute("INSERT OR REPLACE INTO saved_articles(user_id,article_url,article_json) VALUES(?,?,?)",
                  (uid,url,json.dumps(article)))
    return {"saved":True}

@app.delete("/api/saved")
def unsave_article(url: str = Query(...), authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    with db() as c:
        c.execute("DELETE FROM saved_articles WHERE user_id=? AND article_url=?",(uid,url))
    return {"saved":False}

@app.get("/api/saved")
def get_saved(authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    with db() as c:
        rows = c.execute("SELECT article_json FROM saved_articles WHERE user_id=? ORDER BY saved_at DESC",(uid,)).fetchall()
    return {"articles":[json.loads(r["article_json"]) for r in rows]}

@app.get("/api/preferences")
def get_preferences(authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    with db() as c:
        row = c.execute("SELECT categories FROM preferences WHERE user_id=?",(uid,)).fetchone()
    return {"categories":json.loads(row["categories"]) if row else []}

@app.put("/api/preferences")
def set_preferences(body: PreferenceBody, authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    allowed = {"technology","business","sports","science","world","entertainment","health","education"}
    categories = sorted(set(x for x in body.categories if x in allowed))
    with db() as c:
        c.execute("INSERT OR REPLACE INTO preferences(user_id,categories) VALUES(?,?)",(uid,json.dumps(categories)))
    return {"categories":categories}

@app.get("/api/recommendations")
async def recommendations(authorization: Optional[str] = Header(None)):
    uid = require_user(authorization)
    with db() as c:
        row = c.execute("SELECT categories FROM preferences WHERE user_id=?",(uid,)).fetchone()
    cats = json.loads(row["categories"]) if row else []
    if not cats:
        return {"articles":[], "message":"Choose your interests in Preferences to get recommendations."}
    results = []
    for cat in cats[:3]:
        try:
            items, _ = await fetch_news(cat)
            results.extend(items)
        except Exception:
            pass
    seen=set(); unique=[]
    for a in results:
        if a["url"] not in seen:
            seen.add(a["url"]); unique.append(a)
    return {"articles":unique[:10], "message":f"Based on your interests: {', '.join(cats)}"}
