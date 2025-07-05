def load_config(config_file):
    import json
    with open(config_file, 'r') as file:
        return json.load(file)

def log_event(event_message):
    import logging
    logging.basicConfig(level=logging.INFO)
    logging.info(event_message)

def format_output(data):
    return json.dumps(data, indent=4)