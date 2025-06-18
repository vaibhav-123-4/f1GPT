import "./global.css";

export const metadata = {
    title: "F1GPT",
    description: "F1GPT - Your AI companion for Formula 1"
}
const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                {children}
            </body>
        </html>
    );
}

export default RootLayout;

