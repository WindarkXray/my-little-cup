#!/bin/bash
# Télécharge les photos du site dans le dossier images/ (double-clic sur Mac)
cd "$(dirname "$0")"
mkdir -p images
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15"
curl -sL -A "$UA" -o "images/hero.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_blog_smarksthespots.jpg" && echo "✓ hero" || echo "✗ hero"
curl -sL -A "$UA" -o "images/cafe-01.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_01.jpg" && echo "✓ cafe-01" || echo "✗ cafe-01"
curl -sL -A "$UA" -o "images/cafe-02.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_02.jpg" && echo "✓ cafe-02" || echo "✗ cafe-02"
curl -sL -A "$UA" -o "images/cafe-03.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_03.jpg" && echo "✓ cafe-03" || echo "✗ cafe-03"
curl -sL -A "$UA" -o "images/cafe-04.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_04.jpg" && echo "✓ cafe-04" || echo "✗ cafe-04"
curl -sL -A "$UA" -o "images/cafe-05.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_05.jpg" && echo "✓ cafe-05" || echo "✗ cafe-05"
curl -sL -A "$UA" -o "images/cafe-06.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_06.jpg" && echo "✓ cafe-06" || echo "✗ cafe-06"
curl -sL -A "$UA" -o "images/cafe-07.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_07.jpg" && echo "✓ cafe-07" || echo "✗ cafe-07"
curl -sL -A "$UA" -o "images/cafe-08.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_08.jpg" && echo "✓ cafe-08" || echo "✗ cafe-08"
curl -sL -A "$UA" -o "images/cafe-09.jpg" "https://www.smarksthespots.com/wp-content/uploads/2016/04/my_little_cup_cafe_brussels_smarksthespots_blog_09.jpg" && echo "✓ cafe-09" || echo "✗ cafe-09"
curl -sL -A "$UA" -o "images/laurent.jpg" "https://europeancoffeetrip.com/wp-content/uploads/2016/09/laurentdano-1024x682.jpg" && echo "✓ laurent" || echo "✗ laurent"
curl -sL -A "$UA" -o "images/devanture.jpg" "https://europeancoffeetrip.com/wp-content/uploads/2016/09/2dba7b_6f88b22e1bae44e3ae361c2b86175d73.jpg" && echo "✓ devanture" || echo "✗ devanture"
curl -sL -A "$UA" -o "images/comptoir.webp" "https://cafes-img.caffeatlas.com/my-little-cup-brussels/image-1.webp" && echo "✓ comptoir" || echo "✗ comptoir"
echo "Terminé. Les photos sont dans le dossier images/."
