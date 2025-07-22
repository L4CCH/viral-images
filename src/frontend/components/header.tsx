"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-sans text-gray-800">
          Viral Images
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
            About
          </Link>
          <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
            FAQ
          </Link>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <nav className="flex flex-col gap-4 pt-8">
                <Link href="/about" className="text-lg font-medium text-gray-700 hover:text-gray-900" onClick={() => setIsOpen(false)}>
                  About
                </Link>
                <Link href="/faq" className="text-lg font-medium text-gray-700 hover:text-gray-900" onClick={() => setIsOpen(false)}>
                  FAQ
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
