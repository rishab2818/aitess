import sys
import os

sys.stdout.reconfigure(line_buffering=True)

LETTER_MAP = {chr(ord("A") + i): i + 1 for i in range(26)}
rdf_lines = []

def save_rdf():
    os.makedirs("downloads", exist_ok=True)
    with open("downloads/output.rdf", "w") as rdf:
        rdf.write("RDF Report:\n")
        rdf.write("\n".join(rdf_lines))
        rdf.write("\n")

def process_line(line):
    line = line.strip()
    if not line:
        return

    if line.startswith("@") and line.endswith(".tpf"):
        filename = line[1:]
        if not os.path.exists(filename):
            msg = f"Error: File '{filename}' not found"
            print(msg)
            rdf_lines.append(msg)
            return
        with open(filename, "r") as f:
            for file_line in f:
                process_line(file_line)
        return

    parts = line.split()
    if len(parts) < 2:
        msg = f"Invalid input: {line}"
        print(msg)
        rdf_lines.append(msg)
        return

    symbol = parts[0].upper()
    values = parts[1:]
    expected_value = str(LETTER_MAP.get(symbol, "?"))
    last_val = values[-1]

    input_log = f"input> {line}"
    print(input_log)
    rdf_lines.append(input_log)

    if last_val == expected_value:
        output_log = f"output> {line}"
        print(output_log)
        rdf_lines.append(output_log)
    else:
        output_line = f"{symbol} " + " ".join(values)
        error_note = f" (ERROR: Expected {expected_value} but got {last_val})"
        output_log = f"output> {output_line}{error_note}"
        print(f"\033[91m{output_log}\033[0m")  # Red colored error in terminal
        rdf_lines.append(output_log)

    # Your existing process_line code here (unchanged)
    line = line.strip()
    if not line:
        return

    if line.startswith("@") and line.endswith(".tpf"):
        filename = line[1:]
        if not os.path.exists(filename):
            msg = f"Error: File '{filename}' not found"
            print(msg)
            rdf_lines.append(msg)
            return
        with open(filename, "r") as f:
            for file_line in f:
                process_line(file_line)
        return

    parts = line.split()
    if len(parts) < 2:
        msg = f"Invalid input: {line}"
        print(msg)
        rdf_lines.append(msg)
        return

    symbol = parts[0].upper()
    values = parts[1:]
    expected_value = str(LETTER_MAP.get(symbol, "?"))
    last_val = values[-1]

    input_log = f"input> {line}"
    print(input_log)
    rdf_lines.append(input_log)

    if last_val == expected_value:
        output_log = f"output> {line}"
        print(output_log)
        rdf_lines.append(output_log)
    else:
        mismatch_val = f"{last_val}*"
        output_vals = values[:-1] + [mismatch_val]
        output_line = f"{symbol} " + " ".join(output_vals)
        output_log = f"output D*> {output_line}"
        terminal_output_log = f"\033[91m{output_log}\033[0m"
        print(terminal_output_log)
        rdf_lines.append(output_log)

def run_cli():
    print("Test Simulator Started (type '@filename.tpf' or enter commands manually, type 'save' to save RDF, 'exit' to quit)")
    while True:
        try:
            user_input = sys.stdin.readline()
            if not user_input:
                break
            user_input = user_input.strip()
        except EOFError:
            break

        if user_input.lower() == "exit":
            print("Exiting...")
            break

        if user_input.lower() == "save":
            save_rdf()
            print("RDF saved.")
            continue

        process_line(user_input)

if __name__ == "__main__":
    run_cli()
