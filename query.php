<?php
require_once("src/php/WordMainr.php");

$api_key = "your_wordnik_api_key";
$wordmainr = new WordMainr($api_key, false);

switch(isset($_GET["method"]) ? $_GET["method"] : "") {
	case "getWords": {
		echo $wordmainr->getWords(isset($_GET["query"]) ? $_GET["query"] : "", array("limit" => 100));
		break;
	}
	
	case "getDefinitions": {
		echo $wordmainr->getDefinitions(isset($_GET["word"]) ? $_GET["word"] : "");
		break;
	}
	
	case "getDomains": {
		echo $wordmainr->getDomains(isset($_GET["word"]) ? $_GET["word"] : "");
		break;
	}
	
	default: {
		echo json_encode(array("error" => "Unknown request."));
	}
}
