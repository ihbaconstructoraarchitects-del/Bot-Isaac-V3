import { google } from "googleapis";
import { sheets_v4 } from "googleapis/build/src/apis/sheets";
import { config } from "../config";

/**
 * 🔧 Sanitiza texto para evitar errores en Google Sheets.
 */
function clean(text: string): string {
  if (!text) return "";
  return text
    .replace(/\0/g, "") // eliminar caracteres nulos
    .replace(/\r?\n/g, "\\n") // evitar saltos peligrosos
    .substring(0, 45000); // límite seguro de Google Sheets
}

class SheetManager {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;

  constructor(spreadsheetId: string, privateKey: string, clientEmail: string) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        private_key: privateKey.replace(/\\n/g, "\n"), // 🔧 corregir formato
        client_email: clientEmail,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.spreadsheetId = spreadsheetId;
  }

  /**
   * 📌 Verifica si una hoja existe
   */
  private async sheetExists(title: string): Promise<boolean> {
    const meta = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    return meta.data.sheets?.some((s) => s.properties?.title === title) ?? false;
  }

  /**
   * 📌 Crea hoja si no existe
   */
  private async ensureSheet(title: string): Promise<void> {
    const exists = await this.sheetExists(title);
    if (exists) return;

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title },
            },
          },
        ],
      },
    });
  }

  /**
   * 📌 Reintento inteligente
   */
  private async retry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise((r) => setTimeout(r, 500));
      return this.retry(fn, retries - 1);
    }
  }

  /**
   * 📌 Guardar mensajes por pestaña de usuario
   */
  async saveMessageToUserSheet(
    number: string,
    role: "user" | "assistant",
    content: string
  ): Promise<void> {
    const safeContent = clean(content);
    const date = new Date().toISOString();

    await this.ensureSheet(number);

    try {
      await this.retry(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${number}!A:C`,
          valueInputOption: "RAW",
          requestBody: {
            values: [[date, role, safeContent]],
          },
        })
      );
    } catch (error) {
      console.error("❌ Error al guardar conversación:", error);
    }
  }

  /**
   * 📌 Guardar conversación global
   */
  async saveMessage(
    number: string,
    role: "user" | "assistant",
    content: string
  ): Promise<void> {
    const safeContent = clean(content);
    const date = new Date().toISOString();

    await this.ensureSheet("Mensajes");

    try {
      await this.retry(() =>
        this.sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: "Mensajes!A:D",
          valueInputOption: "RAW",
          requestBody: {
            values: [[date, number, role, safeContent]],
          },
        })
      );
    } catch (error) {
      console.error("❌ Error guardando mensaje global:", error);
    }
  }

  /**
   * 📌 Verificar si el usuario existe
   */
  async userExists(number: string): Promise<boolean> {
    try {
      await this.ensureSheet("Users");

      const result = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: "Users!A:A",
      });

      const rows = result.data.values || [];
      return rows.some((r) => r[0] === number);
    } catch (error) {
      console.error("❌ Error verificando usuario:", error);
      return false;
    }
  }

  /**
   * 📌 Crear un usuario y su pestaña
   */
  async createUser(number: string, name: string, mail: string): Promise<void> {
    try {
      await this.ensureSheet("Users");

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "Users!A:C",
        valueInputOption: "RAW",
        requestBody: {
          values: [[number, name, mail]],
        },
      });

      await this.ensureSheet(number);
    } catch (error) {
      console.error("❌ Error creando usuario:", error);
    }
  }

  /**
   * 📌 Obtener últimas 3 conversaciones
   */
  async getUserConv(number: string): Promise<any[]> {
    try {
      await this.ensureSheet(number);

      const result = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${number}!A:C`,
      });

      const rows = result.data.values || [];
      const last = rows.slice(-3).reverse();

      return last.flatMap(([q, a]) => [
        { role: "user", content: q },
        { role: "assistant", content: a },
      ]);
    } catch (error) {
      console.error("❌ Error obteniendo conversación:", error);
      return [];
    }
  }

  /**
   * 📌 Agregar conversación al inicio de la lista
   */
  async addConverToUser(
    number: string,
    conversation: { role: string; content: string }[]
  ): Promise<void> {
    try {
      await this.ensureSheet(number);

      const question = conversation.find((c) => c.role === "user")?.content;
      const answer = conversation.find((c) => c.role === "assistant")?.content;
      const date = new Date().toISOString();

      if (!question || !answer) {
        throw new Error("Conversación incompleta.");
      }

      const rowsData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${number}!A:C`,
      });

      const rows = rowsData.data.values || [];
      rows.unshift([clean(question), clean(answer), date]);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${number}!A:C`,
        valueInputOption: "RAW",
        requestBody: { values: rows },
      });
    } catch (error) {
      console.error("❌ Error agregando conversación:", error);
    }
  }
}

export default new SheetManager(
  config.spreadsheetId,
  config.privateKey,
  config.clienteEmail
);
