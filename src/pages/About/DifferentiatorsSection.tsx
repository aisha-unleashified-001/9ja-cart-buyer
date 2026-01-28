import { motion } from "framer-motion";
import { CreditCard, Globe, Shield, TrendingUp } from "lucide-react";
import { fadeInUp, scaleIn, staggerContainer } from "./helper";

const DifferentiatorsSection = () => {
  

  return (
    <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4 text-[#182F38]"
            >
              What Sets Us Apart
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                title: "Local Relevance",
                description:
                  "Strong focus on local market realities and usability",
                icon: Globe,
              },
              {
                title: "Commerce + Fintech",
                description: "Integrated BNPL model for inclusive growth",
                icon: CreditCard,
              },
              {
                title: "Market Insight",
                description: "Deep understanding of African consumer behavior",
                icon: TrendingUp,
              },
              {
                title: "Trust & Inclusion",
                description:
                  "Commitment to transparency and scalable technology",
                icon: Shield,
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ y: -5 }}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 group"
              >
                <div className="p-3 bg-primary/10 rounded-lg inline-block mb-4 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
  );
};

export default DifferentiatorsSection;
