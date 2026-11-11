 import { useState } from "react";

function App() {
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [dark, setDark] = useState(false);

  // News information
  const news = [
    {
      id: 1,
      title: "Latest Technology News",
      category: "Technology",
      icon: "💻",
      description:
        "Discover the latest technology, artificial intelligence, software and digital innovations.",
      content:
        "Technology is developing rapidly. Artificial intelligence, cloud computing, cybersecurity and software development are changing the way people work and communicate. This section provides information about important technology developments.",
      source: "Technology News",
      date: "26 September 2026",
    },

    {
      id: 2,
      title: "Latest Sports News",
      category: "Sports",
      icon: "⚽",
      description:
        "Get the latest sports updates, scores and important events.",
      content:
        "Sports news includes information about football, cricket, basketball, tennis and other major sporting events. Users can select the sports category to explore available news.",
      source: "Sports News",
      date: "26 September 2026",
    },

    {
      id: 3,
      title: "Business News Today",
      category: "Business",
      icon: "📈",
      description:
        "Read the latest business, finance and market updates.",
      content:
        "Business news provides information about companies, markets, finance, startups and economic developments. Users can search for specific business topics.",
      source: "Business News",
      date: "26 September 2026",
    },

    {
      id: 4,
      title: "Health News",
      category: "Health",
      icon: "🏥",
      description:
        "Stay updated with the latest health and wellness information.",
      content:
        "Health news covers general wellness, healthcare technology, medical developments and public health information. Always check reliable sources for important medical information.",
      source: "Health News",
      date: "26 September 2026",
    },

    {
      id: 5,
      title: "World News",
      category: "General",
      icon: "🌎",
      description:
        "Latest national and international news from around the world.",
      content:
        "World news provides information about important events happening nationally and internationally. Users can search for different topics and explore available articles.",
      source: "World News",
      date: "26 September 2026",
    },

    {
      id: 6,
      title: "Artificial Intelligence",
      category: "Technology",
      icon: "🤖",
      description:
        "Explore the latest developments in artificial intelligence.",
      content:
        "Artificial intelligence is being used in education, software development, business, healthcare and many other areas. Modern AI systems can process information, generate content and assist people with different tasks.",
      source: "AI Technology News",
      date: "26 September 2026",
    },

    {
      id: 7,
      title: "Cybersecurity News",
      category: "Technology",
      icon: "🔐",
      description:
        "Learn about cybersecurity, online safety and digital protection.",
      content:
        "Cybersecurity focuses on protecting computers, networks, applications and data from unauthorized access and attacks. Strong passwords, updates and safe browsing practices are important for security.",
      source: "Cybersecurity News",
      date: "26 September 2026",
    },

    {
      id: 8,
      title: "Cricket Updates",
      category: "Sports",
      icon: "🏏",
      description:
        "Latest cricket information, matches and tournament updates.",
      content:
        "Cricket is one of the world's popular sports. This section can display information about matches, teams, players and tournaments.",
      source: "Cricket News",
      date: "26 September 2026",
    },
  ];

  // Search + category filtering
  const filteredNews = news.filter((item) => {
    const categoryMatch =
      category === "General" || item.category === category;

    const searchMatch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase());

    return categoryMatch && searchMatch;
  });

  // Search button
  function handleSearch() {
    setCategory("All");
  }

  // Bookmark
  function addBookmark(article) {
    const exists = bookmarks.some(
      (item) => item.id === article.id
    );

    if (!exists) {
      setBookmarks([...bookmarks, article]);
      alert("✅ Article added to bookmarks!");
    } else {
      alert("⚠️ Article is already bookmarked!");
    }
  }

  // Remove bookmark
  function removeBookmark(id) {
    setBookmarks(
      bookmarks.filter((item) => item.id !== id)
    );
  }

  // Category selection
  function selectCategory(item) {
    setCategory(item);
    setSearch("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#111827" : "#f1f3f6",
        color: dark ? "white" : "#111827",
        fontFamily: "Arial, sans-serif",
      }}
    >

      {/* ================= HEADER ================= */}

      <header
        style={{
          background: "#23408e",
          color: "white",
          padding: "35px 20px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "52px",
            margin: "0 0 10px",
          }}
        >
          📰 News Aggregator
        </h1>

        <p
          style={{
            fontSize: "22px",
            margin: 0,
          }}
        >
          Latest News • Search • Categories • Bookmarks
        </p>
      </header>

      {/* ================= SEARCH ================= */}

      <section
        style={{
          textAlign: "center",
          padding: "30px 20px 15px",
        }}
      >
        <input
          type="text"
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          style={{
            width: "55%",
            padding: "17px",
            fontSize: "18px",
            borderRadius: "10px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleSearch}
          style={{
            marginLeft: "12px",
            padding: "17px 25px",
            fontSize: "17px",
            background: "#2864e8",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          🔍 Search
        </button>
      </section>

      {/* ================= CATEGORIES ================= */}

      <nav
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
          padding: "20px",
        }}
      >
        {[
          "General",
          "Technology",
          "Sports",
          "Business",
          "Health",
        ].map((item) => (
          <button
            key={item}
            onClick={() => selectCategory(item)}
            style={{
              padding: "14px 25px",
              border: "none",
              borderRadius: "10px",
              background:
                category === item
                  ? "#2864e8"
                  : "#374151",
              color: "white",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {item}
          </button>
        ))}

        <button
          onClick={() => setDark(!dark)}
          style={{
            padding: "14px 25px",
            border: "none",
            borderRadius: "10px",
            background: "#111827",
            color: "white",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </nav>

      {/* ================= NEWS ================= */}

      <main
        style={{
          maxWidth: "1400px",
          margin: "auto",
          padding: "25px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "30px",
          }}
        >
          {category === "All"
            ? `Search Results for "${search}"`
            : `${category} News`}
        </h2>

        {filteredNews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
            }}
          >
            <h2>😔 No News Found</h2>
            <p>
              Try another search word or select another category.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "25px",
              marginTop: "30px",
            }}
          >
            {filteredNews.map((article) => (
              <div
                key={article.id}
                style={{
                  background: dark ? "#1f2937" : "white",
                  borderRadius: "15px",
                  padding: "20px",
                  boxShadow:
                    "0 5px 15px rgba(0,0,0,0.15)",
                  textAlign: "center",
                }}
              >
                {/* Image/Icon */}
                <div
                  style={{
                    height: "150px",
                    background: dark
                      ? "#374151"
                      : "#e5e7eb",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "70px",
                  }}
                >
                  {article.icon}
                </div>

                <h2>{article.title}</h2>

                <p
                  style={{
                    fontSize: "17px",
                    lineHeight: "1.5",
                  }}
                >
                  {article.description}
                </p>

                <p>
                  <b>Category:</b> {article.category}
                </p>

                {/* Read More */}
                <button
                  onClick={() =>
                    setSelectedNews(article)
                  }
                  style={{
                    padding: "12px 18px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    margin: "5px",
                  }}
                >
                  📖 Read Full News
                </button>

                {/* Bookmark */}
                <button
                  onClick={() => addBookmark(article)}
                  style={{
                    padding: "12px 18px",
                    background: "#111827",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    margin: "5px",
                  }}
                >
                  🔖 Bookmark
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ================= BOOKMARKS ================= */}

        <section
          style={{
            background: dark ? "#1f2937" : "white",
            marginTop: "50px",
            padding: "25px",
            borderRadius: "15px",
          }}
        >
          <h2>🔖 My Bookmarks</h2>

          {bookmarks.length === 0 ? (
            <p>No bookmarked articles yet.</p>
          ) : (
            bookmarks.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <span>
                  {item.icon} {item.title}
                </span>

                <button
                  onClick={() =>
                    removeBookmark(item.id)
                  }
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </section>
      </main>

      {/* ================= FULL NEWS POPUP ================= */}

      {selectedNews && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
          onClick={() => setSelectedNews(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: dark ? "#1f2937" : "white",
              color: dark ? "white" : "#111827",
              width: "90%",
              maxWidth: "750px",
              maxHeight: "85vh",
              overflowY: "auto",
              borderRadius: "15px",
              padding: "30px",
            }}
          >
            <div
              style={{
                textAlign: "center",
                fontSize: "70px",
              }}
            >
              {selectedNews.icon}
            </div>

            <h1>{selectedNews.title}</h1>

            <p>
              <b>Category:</b>{" "}
              {selectedNews.category}
            </p>

            <p>
              <b>Source:</b> {selectedNews.source}
            </p>

            <p>
              <b>Date:</b> {selectedNews.date}
            </p>

            <hr />

            <h2>News Information</h2>

            <p
              style={{
                fontSize: "18px",
                lineHeight: "1.7",
              }}
            >
              {selectedNews.content}
            </p>

            <button
              onClick={() =>
                addBookmark(selectedNews)
              }
              style={{
                padding: "13px 20px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              🔖 Bookmark
            </button>

            <button
              onClick={() => setSelectedNews(null)}
              style={{
                padding: "13px 20px",
                background: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              ❌ Close
            </button>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}

      <footer
        style={{
          marginTop: "50px",
          background: "#111827",
          color: "white",
          textAlign: "center",
          padding: "35px",
        }}
      >
        <h2>News Aggregator Project</h2>

        <p>
          React • Node.js • MongoDB • REST API
        </p>

        <p>
          © 2026 KLU Academic Project
        </p>
      </footer>
    </div>
  );
}

export default App;