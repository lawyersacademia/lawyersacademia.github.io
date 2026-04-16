<?php
if (function_exists('curl_version')) {
    echo "✅ cURL is INSTALLED on this hosting";
} else {
    echo "❌ cURL is NOT installed";
}
?>