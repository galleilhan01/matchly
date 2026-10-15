import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-6">
      <div className="card w-full max-w-[440px] text-center">
        <p className="text-[32px]">⛔</p>
        <h1 className="mt-2 font-display text-[22px] font-semibold text-ink">Compte suspendu</h1>
        <p className="mt-2 text-[14.5px] text-ink-soft">
          Votre compte a été suspendu par l'équipe Matchly. Si vous pensez qu'il s'agit d'une erreur, contactez le support.
        </p>
        <Link href="/login" className="btn-ghost mt-6">
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
