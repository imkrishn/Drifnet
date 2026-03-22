export async function verifyUser() {
  try {
    const user = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/auth/verifyUser`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
      }
    );

    if (!user.ok) return null;

    const data = await user.json();
    return data;
  } catch (err) {
    console.log(err);
    return null;
  }
}
