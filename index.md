---
title: Home
layout: default
permalink: /
---
{% assign featured=site.posts | where: 'featured', true %}
<section class="grid" id="featured-products">
	{% for product in featured | limit: 12 %}
		{% include featured-product.html product=product %}
	{% endfor %}
</section>
