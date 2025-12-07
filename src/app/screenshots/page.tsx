// app/screenshots/page.tsx
"use client";

import { useEffect, useState } from "react";

type ScreenshotItem = {
  key: string;
  size: number;
  lastModified: string;
  url: string;
};

export default function ScreenshotsPage() {
  const [items, setItems] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScreenshots() {
      try {
        const res = await fetch("/api/screenshots");
        console.log(res)
        if (!res.ok) throw new Error("Failed to load screenshots");
        const data = await res.json();
        setItems(data.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchScreenshots();
  }, []);

  if (loading) return <div>Loading screenshots...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>S3 Knife Detections</h1>
      {items.length === 0 && <p>No screenshots found.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              border: "1px solid #444",
              borderRadius: 8,
              padding: 8,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                fontSize: 12,
                wordBreak: "break-all",
                marginBottom: 8,
              }}
            >
              {item.key}
            </div>
            {/* if the bucket/object is public-readable, this will show the image */}
            <img
              src={item.url}
              alt={item.key}
              style={{ width: "100%", height: "auto" }}
            />
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <div>Size: {item.size} bytes</div>
              <div>
                Last modified:{" "}
                {item.lastModified
                  ? new Date(item.lastModified).toLocaleString()
                  : "Unknown"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
