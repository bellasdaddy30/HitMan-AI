# HitMan AI — ACE-Step Colab Server
# Run each cell in order. The last cell prints your MUSIC_API_URL.
# Paste that URL into your .env.local as MUSIC_API_URL=https://...
#
# Session lasts ~12 hours. When it dies, rerun all cells and update the URL.

# ── CELL 1: Install ──────────────────────────────────────────────────────────
# !pip install -q flask flask-cors pyngrok
# !pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cu121
# !pip install -q git+https://github.com/ace-step/ACE-Step.git

# ── CELL 2: Load model ───────────────────────────────────────────────────────
# import torch
# from acestep.pipeline import ACEStepPipeline
#
# print("Loading ACE-Step model... (takes ~2 min first time)")
# pipe = ACEStepPipeline.from_pretrained(
#     "ACE-Step/ACE-Step-v1-3.5B",
#     torch_dtype=torch.float16,
# )
# pipe = pipe.to("cuda")
# print("Model ready.")

# ── CELL 3: Start server + ngrok ─────────────────────────────────────────────
# import base64, io, tempfile, os
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from pyngrok import ngrok
# import soundfile as sf
#
# app = Flask(__name__)
# CORS(app)
#
# @app.route("/health")
# def health():
#     return jsonify({"ok": True})
#
# @app.route("/generate", methods=["POST"])
# def generate():
#     body = request.get_json()
#     lyrics   = body.get("lyrics", "")
#     tags     = body.get("tags", "pop")
#     duration = float(body.get("duration", 30))
#     seed     = int(body.get("seed", -1))
#
#     try:
#         result = pipe(
#             lyrics=lyrics,
#             tags=tags,
#             duration=duration,
#             seed=seed if seed >= 0 else None,
#         )
#         # result.audios is a list of numpy arrays, sample_rate is an int
#         audio_np = result.audios[0]
#         sr = result.sample_rate
#         used_seed = result.seeds[0] if hasattr(result, "seeds") else seed
#
#         buf = io.BytesIO()
#         sf.write(buf, audio_np.T, sr, format="WAV")
#         audio_b64 = base64.b64encode(buf.getvalue()).decode()
#
#         return jsonify({"audio_b64": audio_b64, "seed": used_seed})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
# # Free ngrok account: sign up at ngrok.com, copy your authtoken
# ngrok.set_auth_token("PASTE_YOUR_NGROK_TOKEN_HERE")
# public_url = ngrok.connect(5000).public_url
# print(f"\n{'='*60}")
# print(f"  MUSIC_API_URL={public_url}")
# print(f"  Paste this into ~/hitman-ai/.env.local")
# print(f"{'='*60}\n")
#
# app.run(port=5000)
