<?php
require_once("Domainr.php");
require_once("Wordnik.php");
require_once("whois/whois.main.php");

class WordMainr {
  private $cache_dir = "/cache/wordmainr";
  private $cache_ext = ".cache";

  private $cache_enabled;
  private $cache_file;

  private $domainr;
  private $whois;
  private $wordnik;

  // Constructor
  public function WordMainr($wordnik_api_key, $cache_enabled = true) {
    $this->cache_file = "";
    $this->cache_enabled = $cache_enabled;

    $this->domainr = Domainr::instance();
    
    $this->whois = new Whois();
    $this->whois->deep_whois = false; // faster

    $this->wordnik = Wordnik::instance($wordnik_api_key);
  }

  // Returns a list of words from a query via wordnik.com
  public function getWords($query, $params = array()) {
    if (!$query) {
      return $this->error("Query is empty or missing.");
    }

    $hash = md5($query . "|" . implode(":", $params));
    $cache_file = $this->getCacheFile("/words/", $hash);

    if (!$this->cache_enabled || !($response = $this->getCached($cache_file))) {
      try {
        $response = json_encode($this->wordnik->getWordSearch($query, $params));
      } catch(Exception $e) {
        return $this->error($e->getMessage());
      }
  
      $this->cache($cache_file, $response);
    }

    return $response;
  }

  // Returns definitions for a word via wordnik.com
  public function getDefinitions($word, $params = array()) {
    if (!$word) {
      return $this->error("Word is empty or missing.");
    }

    $hash = md5($word . "|" . implode(":", $params));
    $cache_file = $this->getCacheFile("/definitions/", $hash);

    if (!$this->cache_enabled || !($response = $this->getCached($cache_file))) {
      try {
        $response = json_encode($this->wordnik->getDefinitions($word, $params));
      } catch(Exception $e) {
        return $this->error($e->getMessage());
      }

      $this->cache($cache_file, $response);
    }

    return $response;
  }

  // Returns a list of domains for a word via domai.nr
  public function getDomains($word, $params = array()) {
    if (!$word) {
      return $this->error("Word is empty or missing.");
    }

    $hash = md5($word . "|" . implode(":", $params));
    $cache_file = $this->getCacheFile("/domains/", $hash);

    if (!$this->cache_enabled || !($response = $this->getCached($cache_file))) {
      try {
        $response = json_encode($this->domainr->json("search", array("q" => $word)));
      } catch(Exception $e) {
        return $this->error($e->getMessage());
      }

      $this->cache($cache_file, $response);
    }

    return $response;
  }

  // Returns whois information for a domain name
  public function getWhoisInformation($domain) {
    if (!$word) {
      return $this->error("Domain is empty or missing.");
    }

    $hash = md5($domain);
    $cache_file = $this->getCacheFile("/whois/", $hash);

    if (!$this->cache_enabled || !($response = $this->getCached($cache_file))) {
      try {
        $response = json_encode($this->whois->Lookup($domain));
      } catch(Exception $e) {
        return $this->error($e->getMessage());
      }

      $this->cache($cache_file, $response);
    }

    return $response;
  }
  
  // Caches the result of a request
  private function cache($file, $response) {
    if ($f = fopen($file, "w")) {
      fwrite($f, $response);
      fclose($f);
    }
  }

  // Handle errors and exceptions
  private function error($message) {
    return json_encode(array("error" => $message));
  }

  // Returns a cached response, or false if one was not found
  private function getCached($file) {
    return (file_exists($file) ? file_get_contents($file) : false);
  }

  // Builds the path to a cache file
  private function getCacheFile($dir, $hash) {
    return dirname(__FILE__) . $this->cache_dir . $dir . $hash . $this->cache_ext;
  }
}
