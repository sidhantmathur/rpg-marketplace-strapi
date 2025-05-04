import { http, HttpResponse } from "msw";

export const handlers = [
  // Example handlers - we'll add more as we implement features
  http.get("/api/sessions", () => {
    return HttpResponse.json({
      sessions: [
        {
          id: "1",
          title: "D&D Adventure",
          description: "An epic fantasy adventure",
          date: "2024-05-10",
          maxPlayers: 4,
          currentPlayers: 2,
        },
      ],
    });
  }),

  http.get("/api/sessions/:id", ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      id,
      title: "D&D Adventure",
      description: "An epic fantasy adventure",
      date: "2024-05-10",
      maxPlayers: 4,
      currentPlayers: 2,
    });
  }),
];
