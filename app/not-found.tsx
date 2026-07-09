import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
            <h1 className="text-6xl font-bold">404</h1>
            <h4 className="text-xl font-semibold text-center">
                Sorry, the page you are looking for could not be found
            </h4>
            <Button className="btn-default" asChild>
                <Link href="/">Return Home</Link>
            </Button>
        </div>
    );
}
