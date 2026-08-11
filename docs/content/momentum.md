# Momentum & Impulse

## Concept Summary
Momentum is the product of an object's mass and velocity: $p = mv$. It is a vector quantity, meaning direction matters — a 2 kg block moving right at 3 m/s and a 2 kg block moving left at 3 m/s have opposite momenta, not equal ones.

The most important property of momentum is that it is conserved in any isolated system — one with no external forces acting on it. This is true regardless of what happens inside the system. Two objects colliding, exploding, sticking together, bouncing apart — the total momentum before equals the total momentum after. Always.

Kinetic energy is different. It is only conserved in perfectly elastic collisions — an idealisation where no energy is lost to heat, sound, or deformation. In real collisions, some KE is lost, and in perfectly inelastic collisions (where objects stick), the maximum possible KE is lost while momentum still holds. This is the key conceptual distinction students are tested on: momentum always conserves, KE sometimes does.

Impulse ($J = F\Delta t$) connects force and time to changes in momentum: $J = \Delta p$. This is why airbags work — they extend the collision time, which reduces the peak force needed to change your momentum from moving to stationary. Same $\Delta p$, longer $\Delta t$, smaller $F$.

**Exam Tip:** Always define your positive direction before calculating momentum. Sign errors are the single most common mistake on momentum problems. Write "right = positive" at the top of your working before you touch a number.

## Key Equations
- $p = mv$
- $\sum p_{\text{initial}} = \sum p_{\text{final}}$ (isolated system)
- $J = F\Delta t = \Delta p$

## Practice Questions

### IB Multiple Choice

**Question 1** *(IB Physics SL Paper 1 style — momentum vector)*

A ball of mass $m$ strikes a vertical wall with a speed $v$ at an angle of $\theta$ to the wall. The ball rebounds at the same speed and angle. What is the change in the magnitude of the momentum of the ball?

A) $2mv \sin\theta$  
B) $2mv \cos\theta$  
C) $2mv$  
D) zero

**Answer: D** — The ball's speed is unchanged, so the magnitude of momentum $|p| = mv$ before and $|p| = mv$ after. Change in magnitude is zero. Note: this is a common trap — students often confuse "change in magnitude of momentum" (asked here, $= 0$) with "magnitude of change in momentum" (which would be $2mv \sin\theta$, since the component perpendicular to the wall reverses while the parallel component is unchanged).

**Question 2** *(IB Physics SL Paper 1 style — impulse and average force)*

Two eggs of equal mass fall from the same height onto a padded floor. One of them is broken while the other one bounces upwards intact. The time of collision is the same for both. Which of the following correctly describes the egg that exerts a greater average force on the floor and the reason?

| | Egg with greater average force | Reason |
|---|---|---|
| A | Broken | Greater change in momentum |
| B | Bounces | Less change in momentum |
| C | Broken | Less change in momentum |
| D | Bounces | Greater change in momentum |

**Answer: D** — The bouncing egg changes momentum by $2mv$ (from $-mv$ to $+mv$), while the broken egg changes momentum by only $mv$ (from $-mv$ to $0$). Same collision time, greater impulse required means greater average force by $F = \frac{\Delta p}{\Delta t}$.

### AP Multiple Choice

**Question 1** *(College Board AP Physics 1 Progress Check, Unit 4)*

How does an air mattress protect a stunt person landing on the ground after a stunt?

A) It reduces the kinetic energy loss of the stunt person.  
B) It reduces the momentum change of the stunt person.  
C) It increases the momentum change of the stunt person.  
D) It lengthens the stopping time of the stunt person and reduces the force applied during the landing.

**Answer: D** — By the impulse–momentum theorem, $J = F\Delta t = \Delta p$. The stunt person's change in momentum is fixed by their landing velocity and mass, so $\Delta p$ is the same with or without the mattress. Extending $\Delta t$ — a softer, longer stop — reduces the peak force $F$ required to deliver that same impulse. This is the same principle behind airbags and crumple zones.

**Question 2** *(College Board AP Physics 1 Progress Check, Unit 4)*

Two blocks of masses $M$ and $2M$ initially travel at the same speed $v$ but in opposite directions. They collide and stick together. How much mechanical energy is lost to other forms of energy during the collision?

A) Zero  
B) $\frac{1}{2}Mv^2$  
C) $\frac{3}{4}Mv^2$  
D) $\frac{4}{3}Mv^2$

**Answer: D** — Take rightward as positive. Initial momentum is $p_i = M(+v) + 2M(-v) = -Mv$, and the combined mass after sticking is $3M$, so $v_f = -\frac{v}{3}$. Before the collision $\text{KE}_i = \frac{1}{2}Mv^2 + \frac{1}{2}(2M)v^2 = \frac{3}{2}Mv^2$. After the collision $\text{KE}_f = \frac{1}{2}(3M)\left(\frac{v}{3}\right)^2 = \frac{1}{6}Mv^2$. Energy lost $= \frac{3}{2}Mv^2 - \frac{1}{6}Mv^2 = \frac{4}{3}Mv^2$.

### AP Free Response

*College Board AP Physics 1 Unit 4 Progress Check, FRQ 2 — 15 points, suggested time 25 minutes*

A lab cart of mass $m$ is free to move to the left or right on a straight, horizontal track with negligible friction. The cart is at rest at time $t = 0$. A single, horizontal applied force, which may or may not vary over time, is then exerted on the cart. The resulting momentum $p$ of the cart is shown as a function of $t$ in Figure 2, where the positive direction is taken to be toward the right. The momentum reaches a maximum of $p_\text{max}$ at $t = t_1$.

[Figure 1: a cart of mass $m$ at rest on a horizontal track](/content/momentum/ap-frq-fig1-cart-setup.png)

[Figure 2: momentum against time — rising linearly from zero to $p_\text{max}$ at $t_1$, falling linearly back to zero at $1.5t_1$, then remaining at zero until $2t_1$](/content/momentum/ap-frq-fig2-momentum-time-graph.png)

**(a)** The dots in Figure 3 represent the cart at times $t = 0.9t_1$ and $t = 1.1t_1$. On each dot, draw and label the forces (not components) exerted on the cart at the indicated time. Each force must be represented by a distinct arrow starting on, and pointing away from, the appropriate dot. Relative arrow lengths should reflect relative force magnitudes.

[Figure 3: two empty grids, each with a single dot at its centre, labelled $t = 0.9t_1$ and $t = 1.1t_1$](/content/momentum/ap-frq-fig3-force-diagram-dots.png)

**(b)** Derive an expression for $\Delta x_f$, the final displacement of the cart at time $2t_1$. Express your answer in terms of $m$, $p_\text{max}$, $t_1$, and physical constants, as appropriate.

**(c)** On the grid in Figure 4, sketch a graph of the acceleration as a function of $t$.

[Figure 4: an empty grid with a horizontal axis labelled $t$, marked at $0$, $t_1$ and $2t_1$, and a vertical axis labelled Acceleration with zero at the origin](/content/momentum/ap-frq-fig4-acceleration-grid.png)

**Solutions:**

**(a)** At $t = 0.9t_1$: gravity (downward), normal force (upward, equal magnitude), applied force (rightward — because $\frac{dp}{dt} > 0$ on the rising slope of the $p$–$t$ graph, so the net force points right), with magnitude proportional to that slope, $\frac{p_\text{max}}{t_1}$. At $t = 1.1t_1$: gravity (downward), normal force (upward, equal magnitude), applied force (leftward — because $\frac{dp}{dt} < 0$ on the falling slope, so the net force points left), with magnitude proportional to $\frac{2p_\text{max}}{t_1}$. The leftward arrow at $1.1t_1$ must be drawn twice as long as the rightward arrow at $0.9t_1$, because the falling slope is twice as steep as the rising slope. The gravity and normal force magnitudes are unchanged between the two times.

**(b)** Since $v(t) = p(t)/m$, the displacement is $\Delta x_f = \int_0^{2t_1} v(t)\,dt = \frac{1}{m}\int_0^{2t_1} p(t)\,dt$. The $p$–$t$ curve forms a triangle with base $1.5t_1$ and peak height $p_\text{max}$, then flatlines at zero from $1.5t_1$ to $2t_1$, contributing no further area. The area under the curve is therefore $\frac{1}{2}(1.5t_1)(p_\text{max}) = 0.75\,p_\text{max}t_1$, giving $\Delta x_f = \frac{3p_\text{max}t_1}{4m}$.

**(c)** Since $a(t) = \frac{1}{m}\frac{dp}{dt}$, the acceleration is $\frac{1}{m}$ times the slope of the $p$–$t$ graph, and the graph has three segments. From $t = 0$ to $t = t_1$ the slope is a constant $+\frac{p_\text{max}}{t_1}$, so $a = +\frac{p_\text{max}}{mt_1}$ — a horizontal line above the axis. From $t = t_1$ to $t = 1.5t_1$ the slope is a constant $-\frac{2p_\text{max}}{t_1}$, so $a = -\frac{2p_\text{max}}{mt_1}$ — a horizontal line below the axis, twice as far below zero as the first segment is above it. From $t = 1.5t_1$ to $t = 2t_1$ the momentum is constant at zero, so $a = 0$ — a horizontal line along the axis. The transitions at $t = t_1$ and $t = 1.5t_1$ are instantaneous jumps.

### IB Paper 2 Written Response
*Adapted from IB Physics SL Paper 2 style — collision analysis*

**(a)** Define linear momentum. **[1]**

**(b)** A golf ball of mass 45 g moving with a constant velocity of 2.0 m/s undergoes a head-on collision with a stationary ball of mass 2.0 kg. The line that joins the centres of the balls is along the direction of the velocity of the golf ball.

**(i)** Use Newton's Third Law and Second Law to deduce why the change in momentum of the golf ball is equal and opposite to the change in momentum of the stationary ball during the collision. **[3]**

**(ii)** The variation of force acting on the golf ball F with time t during the collision is shown in the graph below. Show that the magnitude of the change in momentum of the golf ball is approximately 0.11 kg·m/s. **[2]**

**(iii)** Calculate the speed of the golf ball just after the collision. **[3]**

**(iv)** Discuss whether the collision is elastic or inelastic. **[3]**

**Total: 12 marks**

Note: Part (b)(ii) requires an F-t graph image. The area under the curve must come to approximately 0.11 N·s. Current simulation resolves collisions instantaneously (single frame) and cannot generate a live F-t curve. Static graph image needed here, or defer this sub-part until simulation is upgraded to model contact duration.
