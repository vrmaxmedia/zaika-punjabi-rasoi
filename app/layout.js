export const metadata = {
  title: "Zaika Punjabi Rasoi | AI Review Generator",
  description: "Punjabi restaurant in Yamuna Vihar, Delhi. Share your dining experience on Google.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#5a0f14" }}>
        {children}
      </body>
    </html>
  );
}
