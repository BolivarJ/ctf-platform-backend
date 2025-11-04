const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Machine = mongoose.model("Machine", new mongoose.Schema({}, { strict: false }), "machines");

app.get("/api/machines", async (_req, res) => {
  const machines = await Machine.find({}, { logs: 0, userFlag: 0, rootFlag: 0 }).limit(100);
  res.json(machines);
});

app.get("/api/machines/:id", async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id).select("-userFlag -rootFlag");
    if (!machine) return res.status(404).json({ error: "Not found" });
    res.json(machine);
  } catch (e) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.post("/api/machines/:id/validate-flags", async (req, res) => {
  const { userFlag, rootFlag } = req.body;

  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ error: "Máquina no encontrada" });

    const userCorrect = userFlag === machine.userFlag;
    const rootCorrect = rootFlag === machine.rootFlag;

    res.json({ userCorrect, rootCorrect });
  } catch (error) {
    res.status(500).json({ error: "Error al validar flags" });
  }
});


app.patch("/api/machines/:id/stats", async (req, res) => {
  const { solvedBy, avgTime, os } = req.body;
  try {
    const updated = await Machine.findByIdAndUpdate(
      req.params.id,
      { $set: { "stats.solvedBy": solvedBy, "stats.avgTime": avgTime, "stats.os": os } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: "Invalid id" });
  }
});


app.patch("/api/machines/:id/solved", async (req, res) => {
  try {
    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      { $inc: { "stats.solvedBy": 1 } },
      { new: true }
    );

    if (!updatedMachine) {
      return res.status(404).json({ error: "Máquina no encontrada" });
    }

    res.json(updatedMachine);
  } catch (error) {
    console.error("Error al actualizar la máquina:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});




const PORT = 3001;
app.listen(PORT, () => console.log(`API corriendo en http://localhost:${PORT}`));
