# D3Playground
just a place to play with D3 and see what I can figure out

11/18/2025
I have an idea for a way to help people understand the connection between an initial screen that just has kpis and the next layer down
it involves coding a bit of the underlying data into a circle and displaying that around or behind the kpi
then when the user drills in, the data should unwrap from the circle and spread out across the graph

so step one of making this work is just to figure out how to populate the circular graph
the graph is essentially a bar graph showing data from two years by month.
when the data is displayed on the circle, the right and left halfs of the circle become the t12 and pt12 data
with 12 sections on each side, the top being the most recent period, then going down
this should make it usefull for understanding cyclical data as well as making some light cross-year comparisons
if the user is interested and they drill in, they get the data in a bar graph, which is much easier to read