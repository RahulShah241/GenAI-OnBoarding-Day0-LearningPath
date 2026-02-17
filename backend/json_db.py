import json
import os
from typing import List

BASE_DIR =  os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")


def read_json(filename: str):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "r") as f:
        return json.load(f)


def write_json(filename: str, data):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

from fastapi.encoders import jsonable_encoder

def append_json(filename, new_data):
    if not os.path.exists(filename):
        with open(filename, "w") as f:
            json.dump([], f)

    with open(filename, "r") as f:
        data = json.load(f)

    # 🔥 Convert datetime & other types
    new_data = jsonable_encoder(new_data)

    data.append(new_data)

    with open(filename, "w") as f:
        json.dump(data, f, indent=4)


# def append_json(filename: str, new_item):
#     data = read_json(filename)
#     data.append(new_item)
#     write_json(filename, data)
#     return new_item
