import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Compass className="h-7 w-7" />
      </span>
      <p className="mt-6 font-mono text-sm text-subtle">404</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-fg">הדף הזה לא מאוזן</h1>
      <p className="mt-2 max-w-md text-muted">לא מצאנו את מה שחיפשתם. ייתכן שהדף הועבר.</p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/">לדף הבית</ButtonLink>
        <ButtonLink href="/content" variant="secondary">
          לעיון בתכנים
        </ButtonLink>
      </div>
    </Container>
  );
}
