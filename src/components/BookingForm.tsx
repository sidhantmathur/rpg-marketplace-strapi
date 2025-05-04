import { useState } from 'react';

interface BookingFormProps {
  onSubmit: (data: { name: string; email: string; players: string }) => void;
}

export default function BookingForm({ onSubmit }: BookingFormProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const players = formData.get('players') as string;

    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (!players) newErrors.players = 'Number of players is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({ name, email, players });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="name">Name</label>
        <input type="text" id="name" name="name" />
        {errors.name && <span className="error">{errors.name}</span>}
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      <div>
        <label htmlFor="players">Number of Players</label>
        <input type="number" id="players" name="players" min="1" />
        {errors.players && <span className="error">{errors.players}</span>}
      </div>
      <button type="submit">Book Now</button>
    </form>
  );
} 