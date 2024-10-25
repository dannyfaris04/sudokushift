<?php
// Database connection
$host = "localhost";
$user = "root"; // Default username
$password = ""; // Default password (often empty)
$dbname = "itp";

$conn = new mysqli($host, $user, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if the request method is POST for saving new scores
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $playerName = isset($_POST['player_name']) ? $_POST['player_name'] : '';
    $score = isset($_POST['score']) ? $_POST['score'] : 0;
    $timeElapsed = isset($_POST['time_elapsed']) ? $_POST['time_elapsed'] : '';

    // Perform validation on received data
    if (!empty($playerName) && is_numeric($score)) {
        // Insert new score into the leaderboard
        $stmt = $conn->prepare("INSERT INTO leaderboard (name, score, time) VALUES (?, ?, ?)");
        if ($stmt) {
            $stmt->bind_param("sis", $playerName, $score, $timeElapsed); // s for string, i for integer
            if ($stmt->execute()) {
                echo "Score saved successfully!";
            } else {
                echo "Failed to save score to the database.";
            }
            $stmt->close();
        } else {
            echo "Failed to prepare statement.";
        }
    } else {
        echo "Invalid input.";
    }
} else {
    // Query to get data sorted by score (highest first) and time (fastest first)
    $sql = "SELECT name, score, time FROM leaderboard ORDER BY score DESC, time ASC";
    $result = $conn->query($sql);

    $leaderboardData = [];
    if ($result->num_rows > 0) {
        $rank = 1;
        while ($row = $result->fetch_assoc()) {
            $leaderboardData[] = [
                "rank" => $rank++,
                "name" => $row["name"],
                "score" => $row["score"],
                "time" => $row["time"]
            ];
        }
    }

    // Return the data as JSON
    header('Content-Type: application/json');
    echo json_encode($leaderboardData);
}

$conn->close();
?>
