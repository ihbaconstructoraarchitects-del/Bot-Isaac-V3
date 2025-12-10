import "dotenv/config";

export const config = {
  PORT: process.env.PORT ?? 3008,
  //META
  jwtToken: process.env.jwtToken,
  numberId: process.env.numberId,
  verifyToken: process.env.verifyToken,
  version: "v24.0", // 👉 si no pones en .env, usa v24.0

  //sheets
  spreadsheetId: process.env.spreadsheetId,
  privateKey: process.env.privateKey,
  clienteEmail: process.env.clienteEmail

};

