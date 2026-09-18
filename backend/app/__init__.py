import os

# The model only needs one maths thread. More threads reserve extra memory
# at import time, and on a low-memory machine the server then fails to start.
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
