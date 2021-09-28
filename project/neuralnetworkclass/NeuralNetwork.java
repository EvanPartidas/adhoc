package NeuralNetwork;

/**
 * NeuralNetwork that has support for back-propagation and unsupervised learning.
 * @author Evan Partidas
 */
public class NeuralNetwork {


	/**
	 * When not complex both Mom and Dad must possess same structure!
	 * If complex then no weight mixing will occur.
	 * @param mom - mother of child
	 * @param dad - father of child
	 * @param compex - change the structure or just mix weights
	 * @return child - combination of mom and dad
	 */
	public static NeuralNetwork breed(NeuralNetwork mom, NeuralNetwork dad,boolean complex){



		if(complex){
			NeuralModel ret = new NeuralModel(),
					mmdl = mom.getModel(),
					dmdl = dad.getModel();

			ret.setInputSize(randmdl(mmdl,dmdl).getInputSize());
			ret.setOutputSize(randmdl(mmdl,dmdl).getOutputSize());
			ret.setHiddenLayerCount(randmdl(mmdl,dmdl).getHiddenLayerCount());
			ret.setHiddenLayerSizes(randmdl(mmdl,dmdl).getHiddenLayerSizes());
			NeuralNetwork child = new NeuralNetwork(ret);
			return child;
		}

		NeuralModel model = mom.getModel();
		NeuralNetwork child = new NeuralNetwork(model);

		//Mix Weight Matrices

		//Input Layers
		for(int neuron=0;neuron<model.getInputSize();neuron++){
			Neuron n = child.inputs[neuron];
			for(int i=0;i<model.getHiddenLayerSizes()[0];i++){
				n.setWeight(i,randnet(mom,dad).inputs[neuron].getWeight(i));
			}
		}

		//Hidden Layers
		for(int layer = 0;layer<model.getHiddenLayerCount()-1;layer++){
			for(int neuron=0;neuron<model.getHiddenLayerSizes()[layer];neuron++){
				Neuron n = child.hidden[layer][neuron];
				for(int i=0;i<model.getHiddenLayerSizes()[layer+1];i++){
					n.setWeight(i,randnet(mom,dad).hidden[layer][neuron].getWeight(i));
				}
			}
		}

		//Last Hidden Layer
		int lastLayer = model.getHiddenLayerCount()-1;
		for(int neuron=0;neuron<model.getHiddenLayerSizes()[lastLayer];neuron++){
			Neuron n = child.hidden[lastLayer][neuron];
			for(int i=0;i<model.getOutputSize();i++){
				n.setWeight(i,randnet(mom,dad).hidden[lastLayer][neuron].getWeight(i));
			}
		}
		return child;
	}

	/**
	 * Makes and returns a NeuralModel that
	 * represents this network's structure
	 * @return NeuralModel of the NeuralNetwork
	 */
	public NeuralModel getModel(){
		NeuralModel ret = new NeuralModel();
		ret.setHiddenLayerCount(hidden.length);

		int[] counts = new int[hidden.length];
		for(int i=0;i<hidden.length;i++)
			counts[i]=hidden[i].length;

		ret.setHiddenLayerSizes(counts);
		ret.setInputSize(inputs.length);
		ret.setOutputSize(outputs.length);
		return ret;
	}

	/**
	Choose a random neural model
	@param a-first choice
	@param b-second choice
	@return a or b, chosen randomly
	 */
	private static NeuralModel randmdl(NeuralModel a, NeuralModel b){
		return Math.random()>=0.5?a:b;
	}


	/**
	Choose a random neural network
	@param a-first choice
	@param b-second choice
	@return a or b, chosen randomly
	 */
	private static NeuralNetwork randnet(NeuralNetwork a, NeuralNetwork b){
		return Math.random()>=0.5?a:b;
	}

	/**
	 * used to make neuron construction
	 * much shorter
	 * @param neurons number of neurons in the next layer
	 */
	private Neuron constNeuron(int neurons){
		return new Neuron(neurons){
			@Override
			public double actFunction(double zeta) {
				// TODO Auto-generated method stub
				return sigmoid(zeta);
			}
			@Override
			public double derivative(double zeta, boolean active) {
				// TODO Auto-generated method stub
				return sigDeriv(zeta,active);
			}
		};
	}

	//Neural Network matrixes of all Neurons
	Neuron[] inputs, outputs;
	Neuron[][] hidden;
	/**
	re-constructs the network, deleting all old data.
	@param inputs number of inputs neurons
	@param hiddenLayers number of hidden layers
	@param hiddenNeurons number of neurons in each hidden layer
	@param outputs number of output neurons 
	@param actives boolean array of which outputs to pass through an activation function
	 */
	private void construct(int inputs,int hiddenLayers,int[] hiddenNeurons,int outputs){


		//Initializing layer arrays
		this.inputs = new Neuron[inputs];
		this.outputs = new Neuron[outputs];
		hidden = new Neuron[hiddenLayers][];

		// Initializing input layer
		for(int i=0;i<inputs;i++){
			this.inputs[i]= constNeuron(hiddenNeurons[0]);
		}

		// Initializing hidden layers
		for(int i=0;i<hidden.length;i++){
			hidden[i] = new Neuron[hiddenNeurons[i]];
			for(int j=0;j<hidden[i].length;j++){
				if(i==hidden.length-1)
					hidden[hidden.length-1][j]= constNeuron(outputs);
				else
					hidden[i][j]= constNeuron(hiddenNeurons[i+1]);
			}
		}

		//Output layer
		for(int i=0;i<outputs;i++){
			this.outputs[i]= constNeuron(0);
		}
	}
	/**
	 * Construct a NeuralNetwork
	 * @param inputs the number of input neurons
	 * @param hiddenLayers the number of hidden layers
	 * @param hiddenNeurons the amount of neurons to have in each hidden layer
	 * @param outputs the number of output neurons
	 */
	public NeuralNetwork(int inputs,int hiddenLayers,int hiddenNeurons,int outputs){

		int[] hiddenSizes = new int[hiddenLayers];
		for(int i=0;i<hiddenLayers;i++)
			hiddenSizes[i]=hiddenNeurons;

		construct(inputs, hiddenLayers, hiddenSizes, outputs);
	}
	/**
	 * Construct a NeuralNetwork
	 * @param inputs the number of input neurons
	 * @param hiddenNeurons an array which determines the amount of neurons to have in each hidden layer
	 * @param outputs the number of output neurons
	 */
	public NeuralNetwork(int inputs,int[] hiddenNeurons,int outputs){
		construct(inputs, hiddenNeurons.length, hiddenNeurons, outputs);
	}

	/**
	 * Construct using specified model
	 * @param model
	 */
	public NeuralNetwork(NeuralModel model) {
		construct(model.getInputSize(),model.getHiddenLayerCount(),
				model.getHiddenLayerSizes(),model.getOutputSize());
	}
	/**
	 * Randomly adjust the weights in the NeuralNetwork
	 * @param factor - mutation factor (Chance of weight being mutated)
	 */
	public void mutate(double factor){
		for(Neuron n:inputs)
			if(Math.random()<=factor)
				n.randomize();

		for(Neuron[] foo:hidden)
			for(Neuron n:foo)
				if(Math.random()<=factor)
					n.randomize();
	}

	/**
	 * Runs forward-propagation through the NeuralNetwork with specified input neuron values and returns the values in the output neurons
	 * @param in input array
	 * @return the array of outputs
	 */
	public double[] feed(double[] in){

		//Clear data from previous run

		//Input
		for(Neuron n:inputs)
			n.clear();
		//Hidden
		for(Neuron[] arr:hidden)
			for(Neuron n:arr)
				n.clear();

		//Output
		for(Neuron n:outputs)
			n.clear();

		// Set up input layer
		for(int i=0;i<in.length;i++){
			inputs[i].add(in[i]);
			inputs[i].activate();
		}

		// Input Layer to hidden layer
		for(int i=0;i<in.length;i++){
			double val = inputs[i].outputValue();
			for(int j=0;j<hidden[0].length;j++){
				hidden[0][j].add(val*inputs[i].getWeight(j));
			}
		}

		//Hidden layers
		for(int i=0;i<hidden.length-1;i++){
			for(int j=0;j<hidden[i+1].length;j++){
				hidden[i][j].activate();
				double val = hidden[i][j].outputValue();
				for(int k=0;k<hidden[i+1].length;k++){
					hidden[i+1][k].add(val*hidden[i][j].getWeight(k));
				}
			}
		}

		//Hidden to Output Layer
		int ind = hidden.length-1;
		for(int i=0;i<hidden[ind].length;i++){
			hidden[ind][i].activate();
			double val = hidden[ind][i].outputValue();
			for(int j=0;j<outputs.length;j++){
				outputs[j].add(val*hidden[ind][i].getWeight(j));
			}
		}

		//Final Activation and return
		double[] results = new double[outputs.length];

		for(int i=0;i<outputs.length;i++){
			outputs[i].activate();
			results[i]=outputs[i].outputValue();
		}
		return results;
	}
	double error;
	/**
	 * Returns and clears the error 
	 * @return error
	 */
	public double getError(){
		double d = error;
		error=0;
		return d;
	}

	/**
	 * Function for calculating the error in each neuron.
	 * Automatically stores the data in each neuron but does not
	 * change any weights until the <code>learn()</code> function is called.
	 * @param target array of target outputs
	 */
	public void calcCost(double[] target){
		calcCost(target,false);
	}

	/**
	 * Function for calculating the error in each neuron.
	 * Automatically stores the data in each neuron but does not
	 * change any weights until the <code>learn()</code> function is called.
	 * Returns the error of the input neurons for the purpose of chaining NeuralNetworks.
	 * Also allows the target array to simply be the error array for the same reason.
	 * @param target array of target outputs
	 * @param deltas true if the array is an array of deltas
	 * @return input error array
	 */
	public double[] calcCost(double[] target,boolean deltas){


		//Output error
		//If it is an array of deltas,
		//just pass the deltas in as the error
		if(deltas)
			for(int i=0;i<outputs.length;i++)
				outputs[i].setError(target[i]);
		//If it isn't, do the standard protocal
		else
			for(int i=0;i<outputs.length;i++){

				double deltaOut = outputs[i].derivative(outputs[i].outputValue(), true);
				outputs[i].setError((target[i]-outputs[i].outputValue())*deltaOut);
				error+=Math.pow(target[i]-outputs[i].outputValue(),2);
			}

		// Last Hidden layer
		int lind = hidden.length-1;
		for(int j=0;j<hidden[lind].length;j++){
			Neuron n = hidden[lind][j];
			double sum=0;
			for(int k=0;k<outputs.length;k++){
				sum+=outputs[k].getError()*n.getWeight(k);
				n.adjustWeightDelta(k,n.outputValue()*outputs[k].getError());
			}
			n.setError(sum*n.derivative(n.outputValue(),true));
		}

		//Hidden Layers
		for(int i=hidden.length-2;i>=0;i--){
			for(int j=0;j<hidden[i+1].length;j++){
				Neuron n = hidden[i][j];
				double sum=0;
				for(int k=0;k<hidden[i+1].length;k++){
					sum+=hidden[i+1][k].getError()*n.getWeight(k);
					n.adjustWeightDelta(k,hidden[i+1][k].getError()*n.outputValue());
				}
				n.setError(sum*n.derivative(n.outputValue(),true));
			}
		}

		//double array to return
		double[] inputerror=new double[inputs.length];

		// Input layer
		for(int i=0;i<inputs.length;i++){
			Neuron n = inputs[i];
			double sum=0;
			for(int j=0;j<hidden[0].length;j++){
				Neuron h = hidden[0][j];
				sum+=h.getError()*n.getWeight(j);
				n.adjustWeightDelta(j,h.getError()*n.outputValue());

			}
			n.setError(sum);
			inputerror[i]=n.getError();
		}
		return inputerror;
	}

	/**
	 * Adjust the weights in the weight matrices based on
	 * the data generated by <code>calcCost()</code>. Must
	 * call <code>calcCost()</code> before using this method
	 * or nothing will happen.
	 * @param rate mutliplier which affects how much the weight matrices will be changed
	*/
	public void learn(double rate){
		int i,j;

		for(i=0;i<inputs.length;i++){
			inputs[i].adjust(rate);
		}

		for(i=0;i<hidden.length;i++){
			for(j=0;j<hidden[i].length;j++){
				hidden[i][j].adjust(rate);
			}
		}
	}
	
	/**
	 * Randomize the weight matrices of all neurons.
	 */
	public void reset(){
		int i,j;

		for(i=0;i<inputs.length;i++){
			inputs[i].randomize();
		}

		for(i=0;i<hidden.length;i++){
			for(j=0;j<hidden[i].length;j++){
				hidden[i][j].randomize();
			}
		}
	}
}
