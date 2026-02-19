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
import json
import os

def append_json(file_path,new_data):
   
    
    # If file doesn't exist, create with empty list
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            json.dump([], f)

    # Read existing data
    with open(file_path, "r") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            data = []

    # Ensure it's a list
    if not isinstance(data, list):
        raise ValueError("JSON file must contain a list")

    # Append data
    if isinstance(new_data, list):
        data.extend(new_data)
    else:
        data.append(new_data)

    # Write back updated data
    with open(file_path, "w") as f:
        json.dump(data, f, indent=4)


# def append_json(filename: str, new_item):
#     data = read_json(filename)
#     data.append(new_item)
#     write_json(filename, data)
#     return new_item
