<?php
if (function_exists('curl_version')) {
    echo "cURL is enabled<br>";
} else {
    die("cURL is NOT enabled");
}

$ch = curl_init("https://www.google.com");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$result = curl_exec($ch);

if (curl_errno($ch)) {
    echo "Error: " . curl_error($ch);
} else {
    echo "Success - Request worked";
}

curl_close($ch);
?>