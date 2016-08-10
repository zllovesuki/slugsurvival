var actions = require('../src/lib/vuex/actions');

var chai = require('chai');
var expect = chai.expect;
chai.should();
chai.use(require('chai-things'));

// checkTimeConflict: function(oldStart, oldEnd, newStart, newEnd)

describe('Time Conflict Function', function() {
	it('Should return false when new course is ahead', function() {
		expect(actions.checkTimeConflict(null, '1400', '1600', '1200', '1300')).to.be.false;
	})
	it('Should return false when new course is behind', function() {
		expect(actions.checkTimeConflict(null, '1200', '1300', '1400', '1500')).to.be.false;
	})
	it('Should return true when new course is eating from behind', function() {
		expect(actions.checkTimeConflict(null, '0800', '1000', '0900', '1100')).to.be.true;
	})
	it('Should return true when new course is eaten from behind', function() {
		expect(actions.checkTimeConflict(null, '0900', '1100', '0800', '1000')).to.be.true;
	})
	it('Should return true when new course is piggy backing behind existing course', function() {
		expect(actions.checkTimeConflict(null, '0800', '1000', '1000', '1200')).to.be.true;
	})
	it('Should return true when new course is piggy backing in front of existing course', function() {
		expect(actions.checkTimeConflict(null, '1000', '1200', '0800', '1000')).to.be.true;
	})
	it('Should return true when new course inside the existing course', function() {
		expect(actions.checkTimeConflict(null, '1200', '1400', '1230', '1330')).to.be.true;
	})
	it('Should return true when new course inside the existing course but has the same end time', function() {
		expect(actions.checkTimeConflict(null, '1200', '1400', '1100', '1400')).to.be.true;
	})
	it('Should return true when new course inside the existing course but has the same start time', function() {
		expect(actions.checkTimeConflict(null, '1200', '1400', '1200', '1300')).to.be.true;
	})
	it('Should return true when new course outside the existing course but has the same end time', function() {
		expect(actions.checkTimeConflict(null, '1200', '1400', '1000', '1400')).to.be.true;
	})
	it('Should return true when new course outside the existing course', function() {
		expect(actions.checkTimeConflict(null, '1200', '1400', '1000', '1500')).to.be.true;
	})
	it('Should return true when new course outside the existing course but has the same start time', function() {
		expect(actions.checkTimeConflict(null, '1000', '1200', '1000', '1400')).to.be.true;
	})
	it('Should return true when new course overlaps existing course', function() {
		expect(actions.checkTimeConflict(null, '1000', '1200', '1000', '1200')).to.be.true;
	})
})
