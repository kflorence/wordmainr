(function($) {
  wordmainr = {
    options: {
      data: {},
      cache: {},
      $elements: {
        "query": "#query",
        "clear": "#clear",
        "submit": "#submit",
        "options": "#options",
        "results": "#results",
        "status": "#status",
        "words": "#words",
        "list": "#list",
        "word" : ".word",
        "nav": ".navigation",
        "info" : "#information",
        "pages": "#pages",
        "count": "#count",
        "toggle": ".toggle"
      },
      pagination: {
        items_per_page: 10,
        num_edge_entries: 1,
        num_display_links: 5
      },
      overlay: {}
    },

    init: function(options) {
      var self = this;

      // extend options into this object
      $.extend(this, this.options, options || {});

      // store $elements as jQuery objects
      $.each(this.$elements, function(key, value) {
        self.$elements[key] = $(value);
      });

      // store original information
      this.info_html = this.$elements.info.html();

      // toggles
      this.$elements.toggle.each(function(){
        $(this).toggle(function(){
          $($(this).attr("href")).show();
        }, function(){
          $($(this).attr("href")).hide();
        });
      });

      // search submit button
      this.$elements.submit.click(function() {
        self.get_word_list(self.$elements.query.val());
      });

      // query submit via enter key
      this.$elements.query.keypress(function(e) {
        if (e.which == 13) {
          self.get_word_list(self.$elements.query.val());
        }
      });

      // clear search button
      this.$elements.clear.click(function() {
        self.reset();
      });
    },

    // Reset wordmainr back to its original state
    reset: function() {
      this.$elements.nav.hide();
      this.$elements.list.empty();
      this.$elements.query.val("");
      this.$elements.status.hide();
      this.$elements.info.html(this.info_html);
    },

    // handles ajax errors
    generic_ajax_error: function(error) {
      this.$elements.status.text(error);
    },

    // returns an array of words based on the query (morewords.com)
    get_word_list: function(query) {
      var self = this;

      this.$elements.words.hide();
      this.$elements.list.empty();
      this.$elements.info.empty().hide();
      this.$elements.status.text("Loading word list...").show();

      if (query) {
        this.$elements.query.addClass("loading");

        $.ajax({
          url: "query.php",
          data: {
            "method": "getWords",
            "query": query
          },
          dataType: "json",
          success: function(data) {
            if (data) {
              self.data = data;

              if (data.error) {
                self.$elements.status.text(data.error);
              }

              else if (data.length) {
                self.$elements.status.hide();
                self.$elements.nav.pagination(data.length, {
                  items_per_page: self.pagination.items_per_page,
                  num_edge_entries: self.pagination.num_edge_entries,
                  num_display_links: self.pagination.num_display_links,
                  callback: function(page, container) {
                    try {
                      self.paginate_word_list(this, container, page);
                    } catch(e) {
                      console.log(e);
                    }
                  }
                });
              }
            }
          },
          complete: function() {
            self.$elements.query.removeClass("loading");
          },
          error: this.generic_ajax_error
        });
      }

      else {
        this.$elements.status.text("Nothing to query!");
      }
    },

    // gathers information for a word
    get_word_information: function(word_element) {
      var self = this,
        word = word_element.data("word"),
        information = $([
          '<h2></h2>',
          '<div id="definitions">',
            '<h3 class="loading">Definitions</h3>',
            '<div class="container"></div>',
          '</div>',
          '<div id="domains">',
            '<h3 class="loading">Domain Results</h3>',
            '<div class="container"></div>',
          '</div>'
        ].join(""));

      // reset information
      this.$elements.info.html(information).show();
      this.$elements.info.find("h2").text(word);
      $(".selected", this.$elements.words).removeClass("selected");
      word_element.addClass("selected");

      // try to load from cache first
      if (word in this.cache) {
        this.populate_domain_list(word, this.cache[word].domains);
        this.populate_definition_list(word, this.cache[word].definitions);
      }

      // otherwise, fire ajax requests
      else {
        this.cache[word] = {};
        this.get_domain_list(word);
        this.get_definition_list(word);
      }
    },

    // returns a list of domains for a word
    get_domain_list: function(word) {
      var self = this;

      $.ajax({
        url: "query.php",
        data: {
          "method": "getDomains",
          "word": word
        },
        dataType: "json",
        success: function(data) {
          self.cache[word].domains = data;
          self.populate_domain_list(word, data);
        },
        error: this.generic_ajax_error
      });
    },

    // returns a list of definitions for a word
    get_definition_list: function(word) {
      var self = this;

      $.ajax({
        url: "query.php",
        data: {
          "method": "getDefinitions",
          "word": word
        },
        dataType: "json",
        success: function(data) {
          self.cache[word].definitions = data;
          self.populate_definition_list(word, data);
        },
        error: this.generic_ajax_error
      });
    },

    // paginates our words list data
    paginate_word_list: function(pagination, container, page) {
      var self = this,
        start = (page * pagination.items_per_page),
        limit = Math.min((page + 1) * pagination.items_per_page, this.data.length),
        li = $([
          '<li>',
            '<a href="#" class="word"></a>',
          '</li>'
        ].join(''));

      // empty previous page
      this.$elements.list.empty();

      // build current page
      for (var i = start; i < limit; i++) {
        var word = this.data[i].wordstring;

        this.$elements.list.append(li.clone()
          .find(".word")
            .text(word).attr({
              "id": "word" + i,
            }).data({
              "id": i,
              "word": word
            }).click(function() {
              self.get_word_information($(this));
              return false;
            })
          .end()
        );
      }

      this.$elements.nav.show();
      this.$elements.words.show();

      return false;
    },

    // populates the domain list
    populate_domain_list: function(word, data) {
      try {
        if (data) {
          var ul = $("<ul/>"),
            li = $("<li/>");

          if (data.error) {
            ul.append(li.text(data.error.message));
          }

          else {
            $.each(data.results, function() {
              ul.append(li.clone()
                .text(this.domain + " - " + this.availability)
                .addClass(this.availability)
              );
            });
          }

          $("#domains .container", this.$elements.info).append(ul);
          $("#domains .loading", this.$elements.info).removeClass("loading");
        }

        else {
          console.log("Missing required parameter: data");
        }
      }

      // errors
      catch(e) {
        console.log(e);
      }
    },

    // populates the word definition
    populate_definition_list: function(word, data) {
      try {
        if (data) {
          var ol = $("<ol/>"),
            li = $("<li/>"),
            heading = $("<h2/>"),
            part_of_speech = $('<p class="part-of-speech"></p>'),
            container = $("#definitions .container", this.$elements.info);

          if (data.length) {
            $.each(data, function() {
              var section = $("#" + this.partOfSpeech);

              // check for parts of speech
              if (!section.length) {
                section = $(ol.clone().attr("id", this.partOfSpeech));

                container.append(part_of_speech.clone()
                  .html("&mdash;" + this.partOfSpeech)
                ).append(section);
              }

              // append definition
              section.append(li.clone().text(this.text));
            });
          }

          // no results
          else {
            container.text("No definitions found.");
          }

          $("#definitions .loading", this.$elements.info).removeClass("loading");
        }
      }

      // errors
      catch(e) {
        console.log(e);
      }
    }
  };
})(jQuery);
