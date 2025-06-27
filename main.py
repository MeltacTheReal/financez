from datetime import datetime

# Get the current date and time
now = datetime.now()

# Format the date and time
formatted_time = now.strftime("%Y-%m-%d %H:%M:%S")

# Display the result
print("Current Date and Time:", formatted_time)