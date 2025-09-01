import { sql } from "@vercel/postgres";
import { put } from "@vercel/blob";

export default async function handler(request, response) {
  if (request.method === "POST") {
    try {
      const data = JSON.parse(request.body);

      const {
        userName,
        date,
        weight,
        measurements,
        event,
        weeklyAction,
        workoutDays,
        observations,
        photoFile,
        photoName,
      } = data;

      let photoURL = null;

      if (photoFile && photoName) {
        // Converte o Base64 para um buffer de imagem
        const buffer = Buffer.from(photoFile, "base64");
        // Salva a imagem no Vercel Blob Storage
        const blob = await put(photoName, buffer, {
          access: "public",
          addRandomSuffix: true,
        });
        photoURL = blob.url;
      }

      await sql`
        INSERT INTO records (
          user_name,
          record_date,
          weight,
          measurements,
          event,
          weekly_action,
          workout_days,
          observations,
          photo_url
        ) VALUES (
          ${userName},
          ${date},
          ${weight},
          ${measurements},
          ${event},
          ${weeklyAction},
          ${workoutDays},
          ${observations},
          ${photoURL}
        );
      `;

      return response.status(200).json({ result: "success" });
    } catch (error) {
      console.error(error);
      return response
        .status(500)
        .json({ result: "error", error: error.message });
    }
  } else if (request.method === "GET") {
    try {
      const { rows } = await sql`SELECT * FROM records;`;
      return response.status(200).json(rows);
    } catch (error) {
      console.error(error);
      return response
        .status(500)
        .json({ result: "error", error: error.message });
    }
  } else {
    return response
      .status(405)
      .json({ result: "error", error: "Method Not Allowed" });
  }
}