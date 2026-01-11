#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export DJANGO_ENV=development

if [ ! -d ".venv" ]; then
  python -m venv .venv
fi

source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

python manage.py check
# Run Django dev server with built-in autoreload for hot deploys.
python manage.py runserver
