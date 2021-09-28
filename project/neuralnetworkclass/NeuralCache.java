package NeuralNetwork;

import java.io.*;
import java.util.Arrays;
/**
 * Class which stores weight matrix data of a <code>NeuralNetwork</code>
 * @author Evan Partidas
 *
 */
public class NeuralCache implements Serializable{
	//Neural Network data cache

	/**
	 * 
	 */
	private static final long serialVersionUID = -5401384351696055064L;
	
	double[] inputs[];
	double[][] hidden[];
	/**
	 * Construct a cache of the weights of a NeuralNetwork
	 * @param net
	 */
	public NeuralCache(NeuralNetwork net) {
		inputs = new double[net.inputs.length][0];
		for(int i=0;i<net.inputs.length;i++) {
			inputs[i] = Arrays.copyOf(net.inputs[i].weights,net.inputs[i].weights.length);
		}
		hidden = new double[net.hidden.length][net.hidden[0].length][0];
		for(int i=0;i<net.hidden.length;i++) {
			for(int j=0;j<net.hidden[i].length;j++) {
				hidden[i][j] = Arrays.copyOf(net.hidden[i][j].weights,net.hidden[i][j].weights.length);
			}
		}
	}
	
	/**
	 * Take this caches data and put it into a NeuralNetwork
	 * @param net
	 */
	public void installCache(NeuralNetwork net) {
		for(int i=0;i<net.inputs.length;i++) {
			net.inputs[i].weights = Arrays.copyOf(inputs[i],net.inputs[i].weights.length);
		}

		for(int i=0;i<net.hidden.length;i++) {
			for(int j=0;j<net.hidden[i].length;j++) {
				net.hidden[i][j].weights = Arrays.copyOf(hidden[i][j],net.hidden[i][j].weights.length);
			}
		}
	}

}
