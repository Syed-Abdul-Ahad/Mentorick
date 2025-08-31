import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/shared/Footer';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { 
  AiOutlineSearch, 
  AiOutlineHeart, 
  AiOutlineBulb, 
  AiOutlineTeam,
  AiOutlineUser,
  AiOutlineStar,
  AiOutlineEye,
  AiOutlineCompass,
  AiOutlineFlag,
  AiOutlineRocket,
  AiOutlineGift,
  AiOutlineHome
} from 'react-icons/ai';

const OurWhy = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 to-white">
          <div className="container mx-auto px-4 py-20">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              {...fadeInUp}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                For every soul who's ever whispered,
              </h1>
              <p className="text-2xl md:text-3xl text-primary-600 font-semibold mb-8">
                "I wish I had someone to guide me."
              </p>
              <div className="w-24 h-1 bg-primary-500 mx-auto"></div>
            </motion.div>
          </div>
        </div>

        {/* Journey Section */}
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              There's a quiet moment in everyone's journey…
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              When the sabotage, frustration, and doubt creep in.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 mb-16"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Card delay={0.1} className="text-center">
              <AiOutlineSearch className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">The Endless Search</h3>
              <p className="text-gray-600">
                Hours googling through the dark, books, courses, podcasts. Yet still feeling lost.
              </p>
            </Card>

            <Card delay={0.2} className="text-center">
              <AiOutlineBulb className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Half-Built Dreams</h3>
              <p className="text-gray-600">
                You've built half-things. Doubted whole-things. But deep down, you're still alone with your questions.
              </p>
            </Card>

            <Card delay={0.3} className="text-center">
              <AiOutlineCompass className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Blurred Direction</h3>
              <p className="text-gray-600">
                Your drive is real, but the direction feels blurred. Stuck with messy thoughts and a hunger to do something that matters.
              </p>
            </Card>
          </motion.div>

          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Key Insight Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <AiOutlineHeart className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-3">The Truth About Mentorship</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Behind every thriving founder, confident leader, bold creator, or fulfilled professional… was someone who saw them. Guided them. Unlocked what they couldn't see in themselves.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <AiOutlineFlag className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-3">The Problem</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Too many wander for years lost in decision fatigue, shiny distractions, trying to prove themselves in rooms that never clapped.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-xl font-semibold text-primary-600">
                That's what mentorship really is.
              </p>
              <p className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-primary-100 to-primary-50 px-6 py-4 rounded-lg inline-block">
                We exist to change that.
              </p>
            </div>
          </motion.div>
        </div>

        {/* The Big Why Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-shimmer">The Big Why</h2>
              <p className="text-xl mb-8">
                Our WHY is simple yet very ambitious.
              </p>
              <p className="text-2xl font-semibold mb-8">
                We want to see a world of accessibility. Where anyone can connect with world-class leaders in a few clicks.
              </p>
              <p className="text-xl font-bold">No more wild chase.</p>
            </motion.div>
          </div>
        </div>

        {/* Problem Section */}
        <div className="container mx-auto px-4 py-16">
          <motion.div 
            className="grid md:grid-cols-2 gap-12 items-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="bg-red-50 border-red-200">
              <AiOutlineUser className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mentees are exhausted</h3>
              <p className="text-gray-700 leading-relaxed">
                Sliding into DMs, cold emailing, and attending conferences just to catch a glimpse or a sentence of advice.
              </p>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <AiOutlineTeam className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mentors are overwhelmed</h3>
              <p className="text-gray-700 leading-relaxed">
                Flooded with vague requests, scattered messages, and constant asks that don't respect their time or expertise.
              </p>
            </Card>
          </motion.div>

          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Mentorick changes that.</h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              We offer a space where the right conversations happen with purpose. Where seekers get direct access, and mentors engage with people who value their wisdom, all through a structured, respectful, and rewarding system.
            </p>
          </motion.div>
        </div>

        {/* For the ones Section */}
        <div className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                For the ones who need to be seen,
              </h2>
              <p className="text-2xl text-primary-600 font-semibold">
                And the ones who've seen enough to guide.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 gap-12 mb-16"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <Card delay={0.1} className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <AiOutlineEye className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">If you're a Mentee</h3>
                <div className="space-y-3 text-gray-700">
                  <p>Whether you're stuck, starting over, scaling up, or simply seeking the path,</p>
                  <p className="font-semibold text-primary-600">Pull up a chair. Not alone. Not confused.</p>
                  <p>But in the company of someone who gets it.</p>
                </div>
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">When you book, you don't just buy someone's time.</p>
                  <p className="font-semibold text-gray-900">You buy your own urgency.</p>
                </div>
              </Card>

              <Card delay={0.2} className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
                <AiOutlineStar className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">If you're a Mentor</h3>
                <div className="space-y-3 text-gray-700">
                  <p>You survived the hard chapters. You remember what it felt like to wish someone had warned you.</p>
                  <p className="font-semibold text-primary-600">Now, you get to be that person.</p>
                  <p>Your wisdom deserves weight.</p>
                </div>
                <div className="mt-6 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">You don't just mentor.</p>
                  <p className="font-semibold text-gray-900">You shape trajectories.</p>
                </div>
              </Card>
            </motion.div>

            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Impact Statement */}
              <div className="bg-white p-8 rounded-2xl shadow-lg mb-12 border border-gray-100">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <AiOutlineEye className="w-8 h-8 text-purple-500" />
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                  <AiOutlineHeart className="w-8 h-8 text-red-500" />
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                  <AiOutlineRocket className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We're not just a platform. We're a turning point.
                </p>
                <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
                  <p>We've seen dreams rust while people wait for "the right time."</p>
                  <p>We've also seen what happens when someone gives you the wake-up call you didn't know you needed.</p>
                </div>
              </div>
              
              {/* Power of One */}
              <div className="mb-12">
                <h4 className="text-2xl font-bold text-gray-900 mb-8">The Power of One</h4>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="text-center bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 hover:shadow-lg transition-shadow duration-300">
                    <AiOutlineFlag className="w-10 h-10 text-primary-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">One good conversation</p>
                  </Card>
                  <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow duration-300">
                    <AiOutlineRocket className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">One decision</p>
                  </Card>
                  <Card className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-shadow duration-300">
                    <AiOutlineBulb className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">One mindset shift</p>
                  </Card>
                </div>
              </div>
              
              {/* Results */}
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl">
                <p className="text-xl font-bold mb-4">
                  Can save you 6 months of bad decisions. Rewrite a future.
                </p>
                <p className="text-lg text-gray-300">
                  And tell you: <span className="text-primary-400 font-semibold">"Nope, don't build that, build this."</span>
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="container mx-auto px-4 py-20">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Mission Card */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-12 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <AiOutlineRocket className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
              <p className="text-xl leading-relaxed">
                We dream of enabling people to go from <span className="font-bold text-yellow-300">wandering to winning</span>, 
                skip the trial and error in this already little, fast-paced life, and get 
                <span className="font-bold text-yellow-300"> guided towards success</span>.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Detailed Sections - Redesigned with Better Hierarchy */}
        <div className="bg-gradient-to-br from-gray-50 to-primary-50 py-20">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <motion.div 
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Your Journey Starts Here</h2>
              <p className="text-lg text-gray-600">Choose your path and discover what makes Mentorick special for you</p>
            </motion.div>

            {/* Main Content Layout */}
            <div className="max-w-6xl mx-auto">
              <motion.div 
                className="grid lg:grid-cols-2 gap-12"
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                {/* Mentee Side */}
                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
                  variants={fadeInUp}
                  transition={{ delay: 0.1 }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AiOutlineUser className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">If you're a Mentee</h3>
                    <p className="text-gray-600">Whether you're stuck, starting over, scaling up, or simply seeking the path</p>
                  </div>

                  {/* Content */}
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <div>
                      <h4 className="text-xl font-semibold text-primary-600 mb-3">Pull up a chair.</h4>
                      <p>Not alone. Not confused. But in the company of someone who gets it.</p>
                    </div>

                    <div>
                      <p>Because free advice is everywhere.</p>
                      <p className="font-semibold mt-2">What's rare is focused, committed, life-changing guidance.</p>
                      <p>The kind you actually implement because you've put skin in the game.</p>
                    </div>

                    <div className="bg-primary-50 p-6 rounded-lg border-l-4 border-primary-500">
                      <p className="font-semibold text-gray-900 mb-2">When you book, you don't just buy someone's time.</p>
                      <p className="text-primary-700 font-bold text-lg mb-3">You buy your own urgency.</p>
                      <p className="text-sm">You finally stop gambling your future on guesswork and luck.</p>
                      <p className="text-sm">You start honoring your ambition by investing in it.</p>
                    </div>

                    <div className="pt-4">
                      <p className="text-gray-600 mb-2">It's for the ones who are brave enough to say,</p>
                      <p className="font-bold text-lg text-gray-900 mb-2">"I don't know,"</p>
                      <p className="text-gray-600 mb-2">To the ones wise enough to respond,</p>
                      <p className="font-bold text-lg text-primary-600">"I've been there."</p>
                    </div>
                  </div>
                </motion.div>

                {/* Mentor Side */}
                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
                  variants={fadeInUp}
                  transition={{ delay: 0.2 }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AiOutlineStar className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">If you're a Mentor</h3>
                    <p className="text-gray-600">You survived the hard chapters and remember what it felt like</p>
                  </div>

                  {/* Content */}
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <div>
                      <h4 className="text-xl font-semibold text-emerald-600 mb-3">Now, you get to be that person.</h4>
                      <p>Where "I wish someone told me this" becomes "I told them. Just in time."</p>
                    </div>

                    <div>
                      <p>Yes, you're already successful.</p>
                      <p>Yes, you've built enough.</p>
                      <p className="font-semibold">And this is where it starts to mean more.</p>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-lg border-l-4 border-emerald-500">
                      <p className="text-sm text-gray-600 mb-2">At Mentorick, you get paid, not because you need the money,</p>
                      <p className="font-semibold text-emerald-700 text-lg mb-3">But because your wisdom deserves weight.</p>
                      <p className="text-sm">Because when people invest, they listen. They act. They respect.</p>
                    </div>

                    <div>
                      <p>You've spent years building, failing, learning.</p>
                      <p className="font-semibold">Here, your time is honored.</p>
                      <p>You don't just mentor. You shape trajectories.</p>
                      <p>You shift the entire arc of someone's life or business.</p>
                      <p className="font-bold text-emerald-600 mt-4">And that ripple? That ripple is yours, forever.</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Call to Action */}
              <motion.div 
                className="mt-16 text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto border border-gray-100">
                  <h4 className="text-2xl font-bold text-gray-900 mb-6">Ready to begin your journey?</h4>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/mentors">
                      <Button size="lg" className="min-w-[180px]">
                        <AiOutlineSearch className="w-5 h-5 mr-2" />
                        Find Your Mentor
                      </Button>
                    </Link>
                    <Link to="/mentor-signup">
                      <Button variant="outline" size="lg" className="min-w-[180px]">
                        <AiOutlineStar className="w-5 h-5 mr-2" />
                        Become a Mentor
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Final Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <AiOutlineHome className="w-20 h-20 mx-auto mb-8 opacity-80" />
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Mentorick is the room you always wished existed.
              </h2>
              <p className="text-xl mb-8">
                We exist for the moment everything changes.
              </p>
              <div className="w-32 h-1 bg-white mx-auto mb-12 opacity-50"></div>
              <div className="text-2xl font-semibold mb-8">
                So whether you're ready to give wisdom or receive it with both hands,
              </div>
              <div className="text-3xl font-bold mb-8">
                Mentorick is your home now.
              </div>
              <p className="text-xl mb-12">
                Where life-changing conversations begin.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/mentors">
                  <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                    <AiOutlineSearch className="w-5 h-5 mr-2" />
                    Find Your Mentor
                  </Button>
                </Link>
                <Link to="/mentor-signup">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                    <AiOutlineGift className="w-5 h-5 mr-2" />
                    Become a Mentor
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      </>
  );
};

export default OurWhy;
