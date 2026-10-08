# HitMan AI — ACE-Step Colab Server
# Paste each cell block into a separate Colab code cell and run in order.
# The last cell prints your MUSIC_API_URL. Paste it into Vercel env vars.
#
# Session lasts ~12 hours. When it dies, rerun all cells and update the URL.

# ── CELL 1: Install ──────────────────────────────────────────────────────────
# !pip install -q flask flask-cors pyngrok soundfile
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
# import base64, io, threading
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
#         # ACE-Step renamed 'tags' to 'prompt' in newer releases
#         try:
#             result = pipe(
#                 lyrics=lyrics,
#                 prompt=tags,
#                 duration=duration,
#                 seed=seed if seed >= 0 else None,
#             )
#         except TypeError:
#             result = pipe(
#                 lyrics=lyrics,
#                 tags=tags,
#                 duration=duration,
#                 seed=seed if seed >= 0 else None,
#             )
#         audio_np = result.audios[0]
#         sr = result.sample_rate
#         used_seed = result.seeds[0] if hasattr(result, "seeds") else seed
#
#         buf = io.BytesIO()
#         sf.write(buf, audio_np.T if audio_np.ndim == 2 else audio_np, sr, format="WAV")
#         audio_b64 = base64.b64encode(buf.getvalue()).decode()
#
#         return jsonify({"audio_b64": audio_b64, "seed": used_seed})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
#
# # Get your authtoken from ngrok.com/your-settings (or from your .env.local)
# ngrok.set_auth_token("PASTE_YOUR_NGROK_TOKEN_HERE")
# tunnel = ngrok.connect(5000, bind_tls=True)
# public_url = tunnel.public_url
#
# print(f"\n{'='*60}")
# print(f"  MUSIC_API_URL={public_url}")
# print(f"  Paste this into your Vercel env vars and redeploy")
# print(f"{'='*60}\n")
#
# # Run Flask in a background thread so this cell finishes
# # and the URL stays visible above. Stop the runtime to kill the server.
# t = threading.Thread(target=lambda: app.run(port=5000, use_reloader=False))
# t.daemon = True
# t.start()
# print("Server running. Keep this tab open — closing it kills the tunnel.")
