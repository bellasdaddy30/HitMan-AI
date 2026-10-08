# HitMan AI — ACE-Step Colab Server
# Three cells. Run them top to bottom. Cell 3 prints your MUSIC_API_URL.
# When the session dies, just re-run Cell 3 (model stays loaded in Cell 2).

# ── CELL 1: Install (run once per session) ───────────────────────────────────
import subprocess, sys

PKGS = [
    "flask", "flask-cors", "pyngrok", "soundfile", "loguru",
    "torch", "torchaudio",
    "git+https://github.com/ace-step/ACE-Step.git",
]
for pkg in PKGS:
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", pkg], check=False)
print("Installs done.")

# ── CELL 2: Load model (run once per session) ────────────────────────────────
import inspect, torch

# Support both old (pipeline) and new (pipeline_ace_step) ACE-Step layouts
try:
    from acestep.pipeline_ace_step import ACEStepPipeline
    _NEW_API = True
    print("Using new ACE-Step API (pipeline_ace_step)")
except ImportError:
    from acestep.pipeline import ACEStepPipeline
    _NEW_API = False
    print("Using old ACE-Step API (pipeline)")

print("Loading model… (~2 min first time)")
if _NEW_API:
    # New API: plain constructor, downloads weights automatically
    pipe = ACEStepPipeline(dtype="bfloat16")
else:
    pipe = ACEStepPipeline.from_pretrained(
        "ACE-Step/ACE-Step-v1-3.5B",
        torch_dtype=torch.float16,
    ).to("cuda")

# Figure out which method to call (pipe / pipe.generate / pipe.infer)
if callable(getattr(pipe, "generate", None)):
    _CALL = pipe.generate
    _CALL_NAME = "pipe.generate"
elif callable(getattr(pipe, "infer", None)):
    _CALL = pipe.infer
    _CALL_NAME = "pipe.infer"
else:
    _CALL = pipe
    _CALL_NAME = "pipe.__call__"

_pipe_params = set(inspect.signature(_CALL).parameters.keys())
print(f"Call method : {_CALL_NAME}")
print(f"Params      : {sorted(_pipe_params)}")

STYLE_KWARG    = next((k for k in ["prompt","tags","style_prompt","audio_prompt","style","genres"] if k in _pipe_params), None)
DURATION_KWARG = next((k for k in ["audio_duration","duration"] if k in _pipe_params), "audio_duration")

print(f"style={STYLE_KWARG!r}  duration={DURATION_KWARG!r}")
print("Model ready.")

# ── CELL 3: Start server (re-run this to get a new URL after session restart) ─
import base64, io, random, subprocess, sys, threading

# Self-heal installs so this cell always works even if Cell 1 was skipped
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
    # Seed intentionally omitted — param name changes every ACE-Step release

    try:
        result = _CALL(**kwargs)

        # Handle both list-of-arrays and single-array output shapes
        audio_np = result.audios[0] if hasattr(result, "audios") else result[0]
        sr = result.sample_rate if hasattr(result, "sample_rate") else 44100

        buf = io.BytesIO()
        sf.write(buf, audio_np.T if audio_np.ndim == 2 else audio_np, sr, format="WAV")
        audio_b64 = base64.b64encode(buf.getvalue()).decode()
        return jsonify({"audio_b64": audio_b64, "seed": seed})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500

NGROK_TOKEN = "YOUR_NGROK_TOKEN_HERE"  # paste from ngrok.com/your-settings
ngrok.set_auth_token(NGROK_TOKEN)
ngrok.kill()  # kill any leftover tunnel
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
