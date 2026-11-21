import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Poster — гостевая книга", description: "Лабораторная работа 2. Ethereum Sepolia" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
