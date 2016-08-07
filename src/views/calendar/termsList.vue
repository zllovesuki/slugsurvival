<template>
	<div>
		<div class="overflow-hidden bg-white rounded mb2">
			<template v-for="term in flatTermsList" track-by="code">
				<div class="m0 p0" v-bind:class="{ 'border-top': $index > 0 }">
					<div class="clearfix">
						<div class="left black">
							<a v-link="{ name: 'term', params: { termId: term.code } }" class="btn block h5">
								{{ term.name }}
							</a>
						</div>
					</div>
				</div>
			</template>
		</div>
		<div class="mt2 mb2">
			<div class="overflow-hidden bg-white rounded mb2">
				<div class="m0 p1">
					<div class="clearfix">
						<span class="btn black h4 muted ">Manage: </span>
					</div>
					<!--<div class="clearfix">
						<span class="ml1 btn black h6 muted not-clickable"></span>
					</div>-->
				</div>
				<div class="m0 p2 border-top">
					<div class="clearfix">
						<a class="muted h5 ml1 mb1 bold btn btn-outline {{ color }}" >Add a domain</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>

var getters = require('../../lib/vuex/getters.js')
var actions = require('../../lib/vuex/actions.js')

module.exports = {
	vuex: {
		getters: getters,
		actions: actions
	}
}
</script>
