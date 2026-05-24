module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/styles");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/scripts");

  // Automated collection for all Season 1 guides
  eleventyConfig.addCollection("season1", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/season-1/**/*.md");
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  }
};
