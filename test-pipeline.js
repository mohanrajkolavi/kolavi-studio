async function run() {
  const res = await fetch('http://localhost:3000/api/blog/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      primaryKeyword: "best dog food",
      language: "en",
      country: "us"
    })
  });
  console.log("Status:", res.status);
}
run();
