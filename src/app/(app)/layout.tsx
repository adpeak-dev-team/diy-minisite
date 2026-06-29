
export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="max-w-230 mx-auto">
            {children}
        </div>
    );
}
