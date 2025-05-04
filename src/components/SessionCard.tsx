interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  maxPlayers: number;
  currentPlayers: number;
}

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <div>
      <h2>{session.title}</h2>
      <p>{session.description}</p>
      <p>{session.date}</p>
      <p>
        {session.currentPlayers}/{session.maxPlayers} players
      </p>
    </div>
  );
}
