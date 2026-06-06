# ML-Modell ablegen

Hier wird das TensorFlow.js-Modell für die Zeigerpflanzen-Erkennung erwartet:

```
public/models/zeigerpflanzen/
├── model.json          # Topologie + Gewichtsmanifest
├── group1-shard1of*.bin
└── ...
```

Der `recognitionService` lädt `model.json` einmalig über `/models/zeigerpflanzen/model.json`,
speichert es danach in IndexedDB und arbeitet ab dann vollständig offline.

## Modell erzeugen (zwei Wege)

**A) Eigenes feinjustiertes Modell (empfohlen)**
1. MobileNetV2 in Python/Keras auf die Zeigerpflanzen-Klassen fine-tunen.
2. Exportieren:
   ```bash
   pip install tensorflowjs
   tensorflowjs_converter --input_format=keras model.h5 public/models/zeigerpflanzen
   ```
3. Klassenreihenfolge nach `src/data/modelClasses.ts` übernehmen (Reihenfolge = Output-Index).

**B) Vortrainiertes MobileNet als schneller Start**
- `@tensorflow-models/mobilenet` liefert 1000 ImageNet-Klassen (keine Pflanzenarten-Feinheiten).
- Taugt zum Verdrahten der Pipeline, nicht zur produktiven Arten-Erkennung.
- Für Arten-Erkennung Weg A nutzen.

> Hinweis: `model.json` + `.bin` werden vom Service Worker precached
> (`maximumFileSizeToCacheInBytes` in `vite.config.ts` ggf. anpassen).
