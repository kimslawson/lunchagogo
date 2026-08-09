<script lang="ts">
	// Public landing — apes the splash: logo lockup on the sunburst, big playful CTAs.
</script>

<svelte:head>
	<title>Lunch a Go-Go — Find food trucks fast</title>
</svelte:head>

<div class="centered">
	<div class="brand-lockup">
		<img src="/img/logo.jpg" alt="Lunch a Go-Go" />
		<h1>Find food trucks fast</h1>
	</div>

	<div class="stack" style="width:100%; max-width:420px;">
		<a class="btn btn-primary btn-lg" href="/signup?role=foodie">😋 I want to follow the food</a>
		<a class="btn btn-blue btn-lg" href="/signup?role=truck">🚚 I run a food truck</a>
		<p class="center" style="color:#fff; text-shadow:0 0 8px #000; margin:.4rem 0 0;">
			Already aboard?
			<a href="/login" style="color:#fff; text-decoration:underline;">Log in</a>
		</p>
	</div>
</div>
