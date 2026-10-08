# HitMan AI — ACE-Step Colab Server
# Three cells. Run them top to bottom. Cell 3 prints your MUSIC_API_URL.
# When the session dies, just re-run Cell 3 (model stays loaded in Cell 2).

# ── CELL 1: Install (run once per session) ───────────────────────────────────
import subprocess, sys
for pkg in ["flask", "flask-cors", "pyngrok", "soundfile"]:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=False)

# ── CELL 2: Load model (run once per session) ────────────────────────────────
import inspect, torch
from acestep.pipeline import ACEStepPipeline

print("Loading ACE-Step model… (~2 min first time)")
pipe = ACEStepPipeline.from_pretrained(
    "ACE-Step/ACE-Step-v1-3.5B",
    torch_dtype=torch.float16,
)
pipe = pipe.to("cuda")

# Detect style/duration param names once so Cell 3 never needs to re-detect
_pipe_params = set(inspect.signature(pipe.__call__).parameters.keys())
print("ACE-Step params:", sorted(_pipe_params))

STYLE_KWARG    = next((k for k in ["prompt","tags","style_prompt","audio_prompt","style","genres"] if k in _pipe_params), None)
DURATION_KWARG = "audio_duration" if "audio_duration" in _pipe_params else "duration"
print(f"style={STYLE_KWARG!r}  duration={DURATION_KWARG!r}")
print("Model ready.")

# ── CELL 3: Start server (re-run this to get a new URL after session restart) ─
import base64, io, random, subprocess, sys, threading

# Self-heal: install anything missing so you never get ModuleNotFoundError
for _pkg in ["flask", "flask-cors", "pyngrok", "soundfile"]:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", _pkg], check=False)

from flask import Flask, request, jsonify
from flask_cors import CORS
from pyngrok import ngrok
import soundfile as sf

app = Flask(__name__)
CORS(app)

@app.route("/health")
def health():
    return jsonify({"ok": True})

@app.route("/generate", methods=["POST"])
def generate():
    body     = request.get_json()
    lyrics   = body.get("lyrics", "")
    tags     = body.get("tags", "pop")
    duration = float(body.get("duration", 30))
    seed     = int(body.get("seed", random.randint(0, 999999)))

    kwargs = {DURATION_KWARG: duration, "lyrics": lyrics}
    if STYLE_KWARG:
        kwargs[STYLE_KWARG] = tags

    # Do NOT pass seed — ACE-Step changes this kwarg between versions.
    # We track seed on our side for display only.
    try:
        result   = pipe(**kwargs)
        audio_np = result.audios[0]
        sr       = result.sample_rate

        buf = io.BytesIO()
        sf.write(buf, audio_np.T if audio_np.ndim == 2 else audio_np, sr, format="WAV")
        audio_b64 = base64.b64encode(buf.getvalue()).decode()
        return jsonify({"audio_b64": audio_b64, "seed": seed})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

NGROK_TOKEN = "YOUR_NGROK_TOKEN_HERE"  # paste your token from ngrok.com/your-settings
ngrok.set_auth_token(NGROK_TOKEN)
# Kill any leftover tunnel before starting a new one
ngrok.kill()
tunnel     = ngrok.connect(5000, bind_tls=True)
public_url = tunnel.public_url

print(f"\n{'='*60}")
print(f"  MUSIC_API_URL={public_url}")
print(f"  Add/update this in Vercel → hitman-ai → Settings → Env Vars")
print(f"{'='*60}\n")

t = threading.Thread(target=lambda: app.run(port=5000, use_reloader=False))
t.daemon = True
t.start()
print("Server running.")
