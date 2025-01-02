// Remove or comment out the line that checks for 'command_exists'
// if ! command_exists java; then

// Replace it with a direct check for the 'java' command
if ! which java >/dev/null 2>&1; then
    echo "Error: Java is not installed or not in the system PATH."
    exit 1
fi

// Remove the unused variable 'JAVA_FILE_NAME'
// JAVA_FILE_NAME="Main.java"

// If you need to use the main class name, you can directly use it in the java command
java -cp target/classes com.lazylm.Main