package NeuralNetwork;

/**
 * Code which tests the <code>NeuralNetwork</code>.
 * It teaches the <code>NeuralNetwork</code> how to
 * perform the XOR operation.
 * @author Evan Partidas
 *
 */
public class NeuralNetworkDriver {

	public static void main(String[] args) {
		// TODO Auto-generated method stub
		NeuralNetwork net = new NeuralNetwork(2,1,3,1);
		double[][] inputs =
			{ 
				{1.0,1.0},
				{0,1.0},
				{1.0,0},
				{0,0}
			};
		double[][] target =
			{ 
				{0},
				{1},
				{1},
				{0}
			};
		for(int i=0;i<=200000;i++){
			for(int j=0;j<4;j++){
				net.feed(inputs[j]);
				net.calcCost(target[j]);
				net.learn(0.2);
			}
			if(i%8000==0){
				System.out.print("Error: ");
				System.out.printf("%.12f \n",net.getError());
			}
			//Clear the error
			net.getError();
		}
		for(int j=0;j<4;j++){
			double[] result = net.feed(inputs[j]);
			for(double d:inputs[j]){
				System.out.print(d+" ");
			}
			System.out.print("=");
			for(double d:result){
				System.out.printf("%.0f ",d);
				System.out.printf(" %.5f \n",d);
			}
		}			
	}

}
