export const contentFilter = async (input: string) => {
  try {
    const response = await fetch("https://moderateapi.com/api/v1/moderate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.MODERATEAI_API_KEY!,
      },
      body: JSON.stringify({
        text: input,
        context: "comment",
      }),
    });

    const result = await response.json();

    const safe = result.safe && result.confidence <= 0.95;

    return safe;
  } catch (err) {
    console.error(err);
    return null;
  }
};
